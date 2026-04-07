package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/XimilalaXiang/prompt-manager/internal/database"
	"github.com/XimilalaXiang/prompt-manager/internal/model"
	"github.com/XimilalaXiang/prompt-manager/internal/service"
	"github.com/gin-gonic/gin"
)

type AIConfigHandler struct {
	crypto *service.CryptoService
}

func NewAIConfigHandler(crypto *service.CryptoService) *AIConfigHandler {
	return &AIConfigHandler{crypto: crypto}
}

type AIConfigResponse struct {
	model.AIConfig
	HasAPIKey bool `json:"has_api_key"`
}

func (h *AIConfigHandler) toResponse(config model.AIConfig) AIConfigResponse {
	return AIConfigResponse{
		AIConfig:  config,
		HasAPIKey: config.APIKeyEncrypted != "",
	}
}

func (h *AIConfigHandler) List(c *gin.Context) {
	var configs []model.AIConfig
	query := database.DB.Order("name ASC")

	if active := c.Query("active"); active == "true" {
		query = query.Where("is_active = ?", true)
	}

	if err := query.Find(&configs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	responses := make([]AIConfigResponse, len(configs))
	for i, config := range configs {
		responses[i] = h.toResponse(config)
	}
	c.JSON(http.StatusOK, responses)
}

func (h *AIConfigHandler) Get(c *gin.Context) {
	id := c.Param("id")
	var config model.AIConfig
	if err := database.DB.First(&config, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "config not found"})
		return
	}
	c.JSON(http.StatusOK, h.toResponse(config))
}

type CreateAIConfigRequest struct {
	Name        string  `json:"name" binding:"required"`
	Provider    string  `json:"provider" binding:"required"`
	APIEndpoint string  `json:"api_endpoint" binding:"required"`
	Models      string  `json:"models"`
	APIKey      string  `json:"api_key"`
	MaxTokens   int     `json:"max_tokens"`
	Temperature float64 `json:"temperature"`
	TopP        float64 `json:"top_p"`
	IsActive    *bool   `json:"is_active"`
}

func (h *AIConfigHandler) Create(c *gin.Context) {
	var req CreateAIConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	config := model.AIConfig{
		Name:        req.Name,
		Provider:    req.Provider,
		APIEndpoint: req.APIEndpoint,
		Models:      req.Models,
		MaxTokens:   req.MaxTokens,
		Temperature: req.Temperature,
		TopP:        req.TopP,
		IsActive:    true,
	}
	if config.Models == "" {
		config.Models = "[]"
	}
	if config.MaxTokens == 0 {
		config.MaxTokens = 2000
	}
	if config.Temperature == 0 {
		config.Temperature = 0.7
	}
	if config.TopP == 0 {
		config.TopP = 1.0
	}
	if req.IsActive != nil {
		config.IsActive = *req.IsActive
	}

	if req.APIKey != "" {
		encrypted, err := h.crypto.Encrypt(req.APIKey)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to encrypt API key"})
			return
		}
		config.APIKeyEncrypted = encrypted
	}

	if err := database.DB.Create(&config).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, h.toResponse(config))
}

func (h *AIConfigHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var config model.AIConfig
	if err := database.DB.First(&config, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "config not found"})
		return
	}

	var req CreateAIConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	config.Name = req.Name
	config.Provider = req.Provider
	config.APIEndpoint = req.APIEndpoint
	if req.Models != "" {
		config.Models = req.Models
	}
	if req.MaxTokens > 0 {
		config.MaxTokens = req.MaxTokens
	}
	if req.Temperature > 0 {
		config.Temperature = req.Temperature
	}
	if req.TopP > 0 {
		config.TopP = req.TopP
	}
	if req.IsActive != nil {
		config.IsActive = *req.IsActive
	}

	if req.APIKey != "" {
		encrypted, err := h.crypto.Encrypt(req.APIKey)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to encrypt API key"})
			return
		}
		config.APIKeyEncrypted = encrypted
	}

	if err := database.DB.Save(&config).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, h.toResponse(config))
}

func (h *AIConfigHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := database.DB.Delete(&model.AIConfig{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

func (h *AIConfigHandler) Test(c *gin.Context) {
	id := c.Param("id")
	var config model.AIConfig
	if err := database.DB.First(&config, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "config not found"})
		return
	}

	if config.APIKeyEncrypted == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no API key configured"})
		return
	}

	_, err := h.crypto.Decrypt(config.APIKeyEncrypted)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to decrypt API key"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"message": "API key is valid and decryptable",
	})
}

type FetchModelsRequest struct {
	APIEndpoint string `json:"api_endpoint" binding:"required"`
	APIKey      string `json:"api_key"`
	ConfigID    string `json:"config_id"`
}

func (h *AIConfigHandler) FetchModels(c *gin.Context) {
	var req FetchModelsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	apiKey := req.APIKey
	if apiKey == "" && req.ConfigID != "" {
		var config model.AIConfig
		if err := database.DB.First(&config, "id = ?", req.ConfigID).Error; err == nil {
			if decrypted, err := h.crypto.Decrypt(config.APIKeyEncrypted); err == nil {
				apiKey = decrypted
			}
		}
	}

	baseURL := strings.TrimSuffix(req.APIEndpoint, "/")
	baseURL = strings.TrimSuffix(baseURL, "/chat/completions")
	baseURL = strings.TrimSuffix(baseURL, "/v1")
	modelsURL := baseURL + "/v1/models"

	client := &http.Client{Timeout: 15 * time.Second}
	httpReq, err := http.NewRequest("GET", modelsURL, nil)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("invalid URL: %v", err)})
		return
	}
	if apiKey != "" {
		httpReq.Header.Set("Authorization", "Bearer "+apiKey)
	}

	resp, err := client.Do(httpReq)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": fmt.Sprintf("failed to connect: %v", err)})
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "failed to read response"})
		return
	}

	if resp.StatusCode != 200 {
		c.JSON(http.StatusBadGateway, gin.H{"error": fmt.Sprintf("provider returned %d: %s", resp.StatusCode, string(body))})
		return
	}

	var result struct {
		Data []struct {
			ID string `json:"id"`
		} `json:"data"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "failed to parse models response"})
		return
	}

	models := make([]string, 0, len(result.Data))
	for _, m := range result.Data {
		if m.ID != "" {
			models = append(models, m.ID)
		}
	}
	sort.Strings(models)

	c.JSON(http.StatusOK, gin.H{"models": models})
}
