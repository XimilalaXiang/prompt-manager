package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/XimilalaXiang/prompt-manager/internal/database"
	"github.com/XimilalaXiang/prompt-manager/internal/model"
	"github.com/XimilalaXiang/prompt-manager/internal/service"
	"github.com/gin-gonic/gin"
)

type ImportExportHandler struct {
	crypto *service.CryptoService
}

func NewImportExportHandler(crypto *service.CryptoService) *ImportExportHandler {
	return &ImportExportHandler{crypto: crypto}
}

type ExportPromptsResponse struct {
	ExportedAt string                `json:"exported_at"`
	Count      int                   `json:"count"`
	Prompts    []ExportedPrompt      `json:"prompts"`
}

type ExportedPrompt struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Content     string `json:"content"`
	Category    string `json:"category"`
	Tags        string `json:"tags"`
	PromptType  string `json:"prompt_type"`
	IsFavorite  bool   `json:"is_favorite"`
}

func (h *ImportExportHandler) ExportPrompts(c *gin.Context) {
	format := c.DefaultQuery("format", "json")

	var prompts []model.Prompt
	if err := database.DB.Preload("Category").Find(&prompts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if format == "markdown" {
		var sb strings.Builder
		sb.WriteString("# Exported Prompts\n\n")
		sb.WriteString(fmt.Sprintf("Exported at: %s\n\n", time.Now().Format(time.RFC3339)))

		for _, p := range prompts {
			sb.WriteString(fmt.Sprintf("## %s\n\n", p.Title))
			if p.Description != "" {
				sb.WriteString(fmt.Sprintf("*%s*\n\n", p.Description))
			}
			sb.WriteString(fmt.Sprintf("- Type: %s\n", p.PromptType))
			if p.Category != nil {
				sb.WriteString(fmt.Sprintf("- Category: %s\n", p.Category.Name))
			}
			if p.Tags != "" {
				sb.WriteString(fmt.Sprintf("- Tags: %s\n", p.Tags))
			}
			sb.WriteString(fmt.Sprintf("\n```\n%s\n```\n\n---\n\n", p.Content))
		}

		c.Header("Content-Disposition", "attachment; filename=prompts.md")
		c.Data(http.StatusOK, "text/markdown", []byte(sb.String()))
		return
	}

	exported := make([]ExportedPrompt, len(prompts))
	for i, p := range prompts {
		categoryName := ""
		if p.Category != nil {
			categoryName = p.Category.Name
		}
		exported[i] = ExportedPrompt{
			Title:       p.Title,
			Description: p.Description,
			Content:     p.Content,
			Category:    categoryName,
			Tags:        p.Tags,
			PromptType:  p.PromptType,
			IsFavorite:  p.IsFavorite,
		}
	}

	resp := ExportPromptsResponse{
		ExportedAt: time.Now().Format(time.RFC3339),
		Count:      len(exported),
		Prompts:    exported,
	}

	c.Header("Content-Disposition", "attachment; filename=prompts.json")
	c.JSON(http.StatusOK, resp)
}

type ImportPromptsRequest struct {
	Prompts []ExportedPrompt `json:"prompts" binding:"required"`
}

func (h *ImportExportHandler) ImportPrompts(c *gin.Context) {
	var req ImportPromptsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	imported := 0
	for _, ep := range req.Prompts {
		prompt := model.Prompt{
			Title:       ep.Title,
			Description: ep.Description,
			Content:     ep.Content,
			Tags:        ep.Tags,
			PromptType:  ep.PromptType,
			IsFavorite:  ep.IsFavorite,
		}
		if prompt.PromptType == "" {
			prompt.PromptType = "user"
		}

		if ep.Category != "" {
			var cat model.Category
			if err := database.DB.Where("name = ?", ep.Category).First(&cat).Error; err == nil {
				prompt.CategoryID = &cat.ID
			}
		}

		if err := database.DB.Create(&prompt).Error; err == nil {
			imported++
			version := model.PromptVersion{
				PromptID:          prompt.ID,
				VersionNumber:     1,
				Content:           prompt.Content,
				ChangeDescription: "Imported",
			}
			database.DB.Create(&version)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  fmt.Sprintf("imported %d of %d prompts", imported, len(req.Prompts)),
		"imported": imported,
		"total":    len(req.Prompts),
	})
}

type ExportedAIConfig struct {
	Name        string  `json:"name"`
	Provider    string  `json:"provider"`
	APIEndpoint string  `json:"api_endpoint"`
	Models      string  `json:"models"`
	MaxTokens   int     `json:"max_tokens"`
	Temperature float64 `json:"temperature"`
	TopP        float64 `json:"top_p"`
	IsActive    bool    `json:"is_active"`
}

func (h *ImportExportHandler) ExportAIConfigs(c *gin.Context) {
	var configs []model.AIConfig
	if err := database.DB.Find(&configs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	exported := make([]ExportedAIConfig, len(configs))
	for i, cfg := range configs {
		exported[i] = ExportedAIConfig{
			Name:        cfg.Name,
			Provider:    cfg.Provider,
			APIEndpoint: cfg.APIEndpoint,
			Models:      cfg.Models,
			MaxTokens:   cfg.MaxTokens,
			Temperature: cfg.Temperature,
			TopP:        cfg.TopP,
			IsActive:    cfg.IsActive,
		}
	}

	c.Header("Content-Disposition", "attachment; filename=ai-configs.json")
	c.JSON(http.StatusOK, gin.H{
		"exported_at": time.Now().Format(time.RFC3339),
		"count":       len(exported),
		"configs":     exported,
	})
}

type ImportAIConfigsRequest struct {
	Configs []json.RawMessage `json:"configs" binding:"required"`
}

func (h *ImportExportHandler) ImportAIConfigs(c *gin.Context) {
	var req ImportAIConfigsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	imported := 0
	for _, raw := range req.Configs {
		var cfg struct {
			ExportedAIConfig
			APIKey string `json:"api_key"`
		}
		if err := json.Unmarshal(raw, &cfg); err != nil {
			continue
		}

		config := model.AIConfig{
			Name:        cfg.Name,
			Provider:    cfg.Provider,
			APIEndpoint: cfg.APIEndpoint,
			Models:      cfg.Models,
			MaxTokens:   cfg.MaxTokens,
			Temperature: cfg.Temperature,
			TopP:        cfg.TopP,
			IsActive:    cfg.IsActive,
		}

		if cfg.APIKey != "" {
			encrypted, err := h.crypto.Encrypt(cfg.APIKey)
			if err == nil {
				config.APIKeyEncrypted = encrypted
			}
		}

		if err := database.DB.Create(&config).Error; err == nil {
			imported++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  fmt.Sprintf("imported %d of %d configs", imported, len(req.Configs)),
		"imported": imported,
		"total":    len(req.Configs),
	})
}
