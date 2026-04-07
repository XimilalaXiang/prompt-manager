package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"

	"github.com/XimilalaXiang/prompt-manager/internal/database"
	"github.com/XimilalaXiang/prompt-manager/internal/model"
	"github.com/XimilalaXiang/prompt-manager/internal/service"
	"github.com/gin-gonic/gin"
)

type CompareHandler struct {
	aiProxy *service.AIProxyService
	crypto  *service.CryptoService
}

func NewCompareHandler(aiProxy *service.AIProxyService, crypto *service.CryptoService) *CompareHandler {
	return &CompareHandler{aiProxy: aiProxy, crypto: crypto}
}

type CompareRequest struct {
	Prompt              string                   `json:"prompt" binding:"required"`
	SystemPrompt        string                   `json:"system_prompt"`
	ConversationHistory []service.ConversationMsg `json:"conversation_history"`
	Models              []CompareModel           `json:"models" binding:"required,min=1"`
}

type CompareModel struct {
	ConfigID    string  `json:"config_id" binding:"required"`
	ModelName   string  `json:"model_name" binding:"required"`
	Temperature float64 `json:"temperature"`
	TopP        float64 `json:"top_p"`
	MaxTokens   int     `json:"max_tokens"`
}

type CompareResponse struct {
	Results []ModelResult `json:"results"`
}

type ModelResult struct {
	ConfigID       string `json:"config_id"`
	ModelName      string `json:"model_name"`
	Content        string `json:"content"`
	TokensUsed     int    `json:"tokens_used,omitempty"`
	ResponseTimeMs int    `json:"response_time_ms"`
	Error          string `json:"error,omitempty"`
}

func (h *CompareHandler) Send(c *gin.Context) {
	var req CompareRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	configMap := make(map[string]model.AIConfig)
	for _, m := range req.Models {
		if _, ok := configMap[m.ConfigID]; !ok {
			var config model.AIConfig
			if err := database.DB.First(&config, "id = ?", m.ConfigID).Error; err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("config %s not found", m.ConfigID)})
				return
			}
			configMap[m.ConfigID] = config
		}
	}

	var wg sync.WaitGroup
	results := make([]ModelResult, len(req.Models))

	for i, m := range req.Models {
		wg.Add(1)
		go func(idx int, cm CompareModel) {
			defer wg.Done()
			config := configMap[cm.ConfigID]

			temp := cm.Temperature
			if temp == 0 {
				temp = config.Temperature
			}
			topP := cm.TopP
			if topP == 0 {
				topP = config.TopP
			}
			maxTokens := cm.MaxTokens
			if maxTokens == 0 {
				maxTokens = config.MaxTokens
			}

			resp := h.aiProxy.Call(service.AICallRequest{
				Provider:            config.Provider,
				APIEndpoint:         config.APIEndpoint,
				APIKeyEncrypted:     config.APIKeyEncrypted,
				ModelName:           cm.ModelName,
				Prompt:              req.Prompt,
				SystemPrompt:        req.SystemPrompt,
				ConversationHistory: req.ConversationHistory,
				Temperature:         temp,
				TopP:                topP,
				MaxTokens:           maxTokens,
			})

			results[idx] = ModelResult{
				ConfigID:       cm.ConfigID,
				ModelName:      cm.ModelName,
				Content:        resp.Content,
				TokensUsed:     resp.TokensUsed,
				ResponseTimeMs: resp.ResponseTimeMs,
				Error:          resp.Error,
			}
		}(i, m)
	}

	wg.Wait()
	c.JSON(http.StatusOK, CompareResponse{Results: results})
}

func (h *CompareHandler) Stream(c *gin.Context) {
	var req CompareRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	configMap := make(map[string]model.AIConfig)
	for _, m := range req.Models {
		if _, ok := configMap[m.ConfigID]; !ok {
			var config model.AIConfig
			if err := database.DB.First(&config, "id = ?", m.ConfigID).Error; err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("config %s not found", m.ConfigID)})
				return
			}
			configMap[m.ConfigID] = config
		}
	}

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no")

	flusher, ok := c.Writer.(http.Flusher)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "streaming not supported"})
		return
	}

	var wg sync.WaitGroup
	mu := &sync.Mutex{}

	sendSSE := func(chunk service.StreamChunk) {
		data, _ := json.Marshal(chunk)
		mu.Lock()
		fmt.Fprintf(c.Writer, "data: %s\n\n", string(data))
		flusher.Flush()
		mu.Unlock()
	}

	for _, m := range req.Models {
		wg.Add(1)
		go func(cm CompareModel) {
			defer wg.Done()
			config := configMap[cm.ConfigID]

			modelKey := fmt.Sprintf("%s-%s", cm.ConfigID, cm.ModelName)

			temp := cm.Temperature
			if temp == 0 {
				temp = config.Temperature
			}
			topP := cm.TopP
			if topP == 0 {
				topP = config.TopP
			}
			maxTokens := cm.MaxTokens
			if maxTokens == 0 {
				maxTokens = config.MaxTokens
			}

			h.aiProxy.CallStream(service.AICallRequest{
				Provider:            config.Provider,
				APIEndpoint:         config.APIEndpoint,
				APIKeyEncrypted:     config.APIKeyEncrypted,
				ModelName:           cm.ModelName,
				Prompt:              req.Prompt,
				SystemPrompt:        req.SystemPrompt,
				ConversationHistory: req.ConversationHistory,
				Temperature:         temp,
				TopP:                topP,
				MaxTokens:           maxTokens,
			}, func(chunk service.StreamChunk) {
				chunk.ModelKey = modelKey
				sendSSE(chunk)
			})
		}(m)
	}

	wg.Wait()

	doneData, _ := json.Marshal(map[string]interface{}{"all_done": true})
	fmt.Fprintf(c.Writer, "data: %s\n\n", string(doneData))
	flusher.Flush()
}

type RateRequest struct {
	Prompt       string `json:"prompt" binding:"required"`
	SystemPrompt string `json:"system_prompt"`
	Responses    []struct {
		ModelName string `json:"model_name" binding:"required"`
		Content   string `json:"content" binding:"required"`
	} `json:"responses" binding:"required,min=1"`
	RatingConfig CompareModel `json:"rating_config" binding:"required"`
}

func (h *CompareHandler) Rate(c *gin.Context) {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to read request body"})
		return
	}

	var req RateRequest
	if err := json.Unmarshal(body, &req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var config model.AIConfig
	if err := database.DB.First(&config, "id = ?", req.RatingConfig.ConfigID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "rating config not found"})
		return
	}

	ratingPromptTemplate := `You are an AI response quality evaluator. Rate the following response on these criteria (1-5 each):
1. Accuracy: Is the information correct?
2. Relevance: Does it address the question?
3. Clarity: Is it well-structured and clear?
4. Helpfulness: Is it practically useful?
5. Completeness: Is it thorough?

%sUser question: %s

AI response: %s

Respond ONLY with valid JSON:
{"overallScore":X.X,"criteria":{"accuracy":X,"relevance":X,"clarity":X,"helpfulness":X,"completeness":X},"reasoning":"...","suggestions":"...","confidence":X.X}`

	results := make(map[string]interface{})

	for _, resp := range req.Responses {
		systemContext := ""
		if req.SystemPrompt != "" {
			systemContext = fmt.Sprintf("System prompt: %s\n\n", req.SystemPrompt)
		}

		ratingPrompt := fmt.Sprintf(ratingPromptTemplate, systemContext, req.Prompt, resp.Content)

		aiResp := h.aiProxy.Call(service.AICallRequest{
			Provider:        config.Provider,
			APIEndpoint:     config.APIEndpoint,
			APIKeyEncrypted: config.APIKeyEncrypted,
			ModelName:       req.RatingConfig.ModelName,
			Prompt:          ratingPrompt,
			Temperature:     0.1,
			TopP:            0.9,
			MaxTokens:       1000,
		})

		if aiResp.Error != "" {
			results[resp.ModelName] = map[string]interface{}{
				"error": aiResp.Error,
			}
			continue
		}

		var rating map[string]interface{}
		if err := json.Unmarshal([]byte(aiResp.Content), &rating); err != nil {
			results[resp.ModelName] = map[string]interface{}{
				"raw_response": aiResp.Content,
				"parse_error":  err.Error(),
			}
			continue
		}

		results[resp.ModelName] = rating
	}

	c.JSON(http.StatusOK, gin.H{"ratings": results})
}
