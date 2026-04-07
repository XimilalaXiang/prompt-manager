package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type AIProxyService struct {
	crypto *CryptoService
	client *http.Client
}

func NewAIProxyService(crypto *CryptoService) *AIProxyService {
	return &AIProxyService{
		crypto: crypto,
		client: &http.Client{Timeout: 120 * time.Second},
	}
}

type AICallRequest struct {
	Provider            string            `json:"provider"`
	APIEndpoint         string            `json:"api_endpoint"`
	APIKeyEncrypted     string            `json:"-"`
	ModelName           string            `json:"model_name"`
	Prompt              string            `json:"prompt"`
	SystemPrompt        string            `json:"system_prompt,omitempty"`
	ConversationHistory []ConversationMsg `json:"conversation_history,omitempty"`
	Temperature         float64           `json:"temperature"`
	TopP                float64           `json:"top_p"`
	MaxTokens           int               `json:"max_tokens"`
}

type ConversationMsg struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type AICallResponse struct {
	Content        string `json:"content"`
	TokensUsed     int    `json:"tokens_used,omitempty"`
	ResponseTimeMs int    `json:"response_time_ms"`
	Error          string `json:"error,omitempty"`
}

func (s *AIProxyService) Call(req AICallRequest) AICallResponse {
	startTime := time.Now()

	apiKey, err := s.crypto.Decrypt(req.APIKeyEncrypted)
	if err != nil {
		return AICallResponse{
			Error:          fmt.Sprintf("decrypt API key: %v", err),
			ResponseTimeMs: int(time.Since(startTime).Milliseconds()),
		}
	}

	if req.Temperature == 0 {
		req.Temperature = 0.7
	}
	if req.TopP == 0 {
		req.TopP = 1.0
	}
	if req.MaxTokens == 0 {
		req.MaxTokens = 2000
	}

	var body []byte
	var headers map[string]string
	var url string

	switch req.Provider {
	case "openai", "custom":
		url, headers, body, err = s.buildOpenAIRequest(req, apiKey)
	case "claude":
		url, headers, body, err = s.buildClaudeRequest(req, apiKey)
	case "gemini":
		url, headers, body, err = s.buildGeminiRequest(req, apiKey)
	default:
		return AICallResponse{
			Error:          fmt.Sprintf("unsupported provider: %s", req.Provider),
			ResponseTimeMs: int(time.Since(startTime).Milliseconds()),
		}
	}
	if err != nil {
		return AICallResponse{
			Error:          err.Error(),
			ResponseTimeMs: int(time.Since(startTime).Milliseconds()),
		}
	}

	httpReq, err := http.NewRequest("POST", url, bytes.NewReader(body))
	if err != nil {
		return AICallResponse{
			Error:          fmt.Sprintf("create request: %v", err),
			ResponseTimeMs: int(time.Since(startTime).Milliseconds()),
		}
	}
	for k, v := range headers {
		httpReq.Header.Set(k, v)
	}

	resp, err := s.client.Do(httpReq)
	if err != nil {
		return AICallResponse{
			Error:          fmt.Sprintf("API request failed: %v", err),
			ResponseTimeMs: int(time.Since(startTime).Milliseconds()),
		}
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return AICallResponse{
			Error:          fmt.Sprintf("read response: %v", err),
			ResponseTimeMs: int(time.Since(startTime).Milliseconds()),
		}
	}

	if resp.StatusCode != http.StatusOK {
		return AICallResponse{
			Error:          fmt.Sprintf("API error (%d): %s", resp.StatusCode, string(respBody)),
			ResponseTimeMs: int(time.Since(startTime).Milliseconds()),
		}
	}

	content, tokensUsed, err := s.parseResponse(req.Provider, respBody)
	if err != nil {
		return AICallResponse{
			Error:          fmt.Sprintf("parse response: %v", err),
			ResponseTimeMs: int(time.Since(startTime).Milliseconds()),
		}
	}

	return AICallResponse{
		Content:        content,
		TokensUsed:     tokensUsed,
		ResponseTimeMs: int(time.Since(startTime).Milliseconds()),
	}
}

func (s *AIProxyService) buildOpenAIRequest(req AICallRequest, apiKey string) (string, map[string]string, []byte, error) {
	messages := []map[string]string{}
	if req.SystemPrompt != "" {
		messages = append(messages, map[string]string{"role": "system", "content": req.SystemPrompt})
	}
	for _, msg := range req.ConversationHistory {
		messages = append(messages, map[string]string{"role": msg.Role, "content": msg.Content})
	}
	messages = append(messages, map[string]string{"role": "user", "content": req.Prompt})

	body := map[string]interface{}{
		"model":       req.ModelName,
		"messages":    messages,
		"max_tokens":  req.MaxTokens,
		"temperature": req.Temperature,
		"top_p":       req.TopP,
	}

	data, err := json.Marshal(body)
	if err != nil {
		return "", nil, nil, err
	}

	headers := map[string]string{
		"Content-Type":  "application/json",
		"Authorization": "Bearer " + apiKey,
	}

	return req.APIEndpoint, headers, data, nil
}

func (s *AIProxyService) buildClaudeRequest(req AICallRequest, apiKey string) (string, map[string]string, []byte, error) {
	messages := []map[string]string{}
	for _, msg := range req.ConversationHistory {
		messages = append(messages, map[string]string{"role": msg.Role, "content": msg.Content})
	}
	messages = append(messages, map[string]string{"role": "user", "content": req.Prompt})

	body := map[string]interface{}{
		"model":       req.ModelName,
		"max_tokens":  req.MaxTokens,
		"temperature": req.Temperature,
		"top_p":       req.TopP,
		"messages":    messages,
	}
	if req.SystemPrompt != "" {
		body["system"] = req.SystemPrompt
	}

	data, err := json.Marshal(body)
	if err != nil {
		return "", nil, nil, err
	}

	headers := map[string]string{
		"Content-Type":      "application/json",
		"x-api-key":         apiKey,
		"anthropic-version": "2023-06-01",
	}

	return req.APIEndpoint, headers, data, nil
}

func (s *AIProxyService) buildGeminiRequest(req AICallRequest, apiKey string) (string, map[string]string, []byte, error) {
	contents := []map[string]interface{}{}
	for _, msg := range req.ConversationHistory {
		role := msg.Role
		if role == "assistant" {
			role = "model"
		}
		contents = append(contents, map[string]interface{}{
			"role":  role,
			"parts": []map[string]string{{"text": msg.Content}},
		})
	}
	contents = append(contents, map[string]interface{}{
		"role":  "user",
		"parts": []map[string]string{{"text": req.Prompt}},
	})

	body := map[string]interface{}{
		"contents": contents,
		"generationConfig": map[string]interface{}{
			"maxOutputTokens": req.MaxTokens,
			"temperature":     req.Temperature,
			"topP":            req.TopP,
		},
	}
	if req.SystemPrompt != "" {
		body["systemInstruction"] = map[string]interface{}{
			"parts": []map[string]string{{"text": req.SystemPrompt}},
		}
	}

	data, err := json.Marshal(body)
	if err != nil {
		return "", nil, nil, err
	}

	url := fmt.Sprintf("%s?key=%s", req.APIEndpoint, apiKey)
	headers := map[string]string{
		"Content-Type": "application/json",
	}

	return url, headers, data, nil
}

func (s *AIProxyService) parseResponse(provider string, body []byte) (string, int, error) {
	var data map[string]interface{}
	if err := json.Unmarshal(body, &data); err != nil {
		return "", 0, fmt.Errorf("unmarshal: %w", err)
	}

	switch provider {
	case "openai", "custom":
		choices, _ := data["choices"].([]interface{})
		if len(choices) == 0 {
			return "", 0, fmt.Errorf("no choices in response")
		}
		choice, _ := choices[0].(map[string]interface{})
		message, _ := choice["message"].(map[string]interface{})
		content, _ := message["content"].(string)

		var tokens int
		if usage, ok := data["usage"].(map[string]interface{}); ok {
			if total, ok := usage["total_tokens"].(float64); ok {
				tokens = int(total)
			}
		}
		return content, tokens, nil

	case "claude":
		contentArr, _ := data["content"].([]interface{})
		if len(contentArr) == 0 {
			return "", 0, fmt.Errorf("no content in response")
		}
		block, _ := contentArr[0].(map[string]interface{})
		content, _ := block["text"].(string)

		var tokens int
		if usage, ok := data["usage"].(map[string]interface{}); ok {
			input, _ := usage["input_tokens"].(float64)
			output, _ := usage["output_tokens"].(float64)
			tokens = int(input + output)
		}
		return content, tokens, nil

	case "gemini":
		candidates, _ := data["candidates"].([]interface{})
		if len(candidates) == 0 {
			return "", 0, fmt.Errorf("no candidates in response")
		}
		candidate, _ := candidates[0].(map[string]interface{})
		contentObj, _ := candidate["content"].(map[string]interface{})
		parts, _ := contentObj["parts"].([]interface{})
		if len(parts) == 0 {
			return "", 0, fmt.Errorf("no parts in response")
		}
		part, _ := parts[0].(map[string]interface{})
		content, _ := part["text"].(string)

		var tokens int
		if usage, ok := data["usageMetadata"].(map[string]interface{}); ok {
			if total, ok := usage["totalTokenCount"].(float64); ok {
				tokens = int(total)
			}
		}
		return content, tokens, nil

	default:
		return "", 0, fmt.Errorf("unsupported provider: %s", provider)
	}
}
