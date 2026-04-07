package handler

import (
	"net/http"

	"github.com/XimilalaXiang/prompt-manager/internal/database"
	"github.com/XimilalaXiang/prompt-manager/internal/model"
	"github.com/gin-gonic/gin"
)

type ConversationHandler struct{}

func NewConversationHandler() *ConversationHandler {
	return &ConversationHandler{}
}

func (h *ConversationHandler) ListSessions(c *gin.Context) {
	var sessions []model.ConversationSession
	if err := database.DB.Order("updated_at DESC").Find(&sessions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, sessions)
}

func (h *ConversationHandler) GetSession(c *gin.Context) {
	id := c.Param("id")
	var session model.ConversationSession
	if err := database.DB.First(&session, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	var messages []model.ConversationMessage
	database.DB.Where("session_id = ?", id).Order("message_order ASC").Find(&messages)

	var comparisons []model.ConversationComparison
	database.DB.Where("session_id = ?", id).Find(&comparisons)

	c.JSON(http.StatusOK, gin.H{
		"session":     session,
		"messages":    messages,
		"comparisons": comparisons,
	})
}

type CreateSessionRequest struct {
	Title               string `json:"title" binding:"required"`
	SystemPromptID      string `json:"system_prompt_id"`
	SystemPromptContent string `json:"system_prompt_content"`
	ModelParameters     string `json:"model_parameters"`
}

func (h *ConversationHandler) CreateSession(c *gin.Context) {
	var req CreateSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	session := model.ConversationSession{
		Title:               req.Title,
		SystemPromptContent: req.SystemPromptContent,
		ModelParameters:     req.ModelParameters,
	}
	if req.SystemPromptID != "" {
		session.SystemPromptID = &req.SystemPromptID
	}
	if session.ModelParameters == "" {
		session.ModelParameters = `{"temperature":0.7,"topP":1.0}`
	}

	if err := database.DB.Create(&session).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, session)
}

func (h *ConversationHandler) UpdateSession(c *gin.Context) {
	id := c.Param("id")
	var session model.ConversationSession
	if err := database.DB.First(&session, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	var req CreateSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	session.Title = req.Title
	session.SystemPromptContent = req.SystemPromptContent
	if req.SystemPromptID != "" {
		session.SystemPromptID = &req.SystemPromptID
	}
	if req.ModelParameters != "" {
		session.ModelParameters = req.ModelParameters
	}

	if err := database.DB.Save(&session).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, session)
}

func (h *ConversationHandler) DeleteSession(c *gin.Context) {
	id := c.Param("id")
	database.DB.Where("session_id = ?", id).Delete(&model.ConversationMessage{})
	database.DB.Where("session_id = ?", id).Delete(&model.ConversationComparison{})
	if err := database.DB.Delete(&model.ConversationSession{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

type SaveMessagesRequest struct {
	Messages []struct {
		ID             string `json:"id"`
		MessageType    string `json:"message_type" binding:"required"`
		Content        string `json:"content" binding:"required"`
		AIConfigID     string `json:"ai_config_id"`
		ModelName      string `json:"model_name"`
		TokensUsed     *int   `json:"tokens_used"`
		ResponseTimeMs *int   `json:"response_time_ms"`
		MessageOrder   int    `json:"message_order"`
	} `json:"messages" binding:"required"`
}

func (h *ConversationHandler) SaveMessages(c *gin.Context) {
	sessionID := c.Param("id")
	var session model.ConversationSession
	if err := database.DB.First(&session, "id = ?", sessionID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	var req SaveMessagesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	for _, msg := range req.Messages {
		message := model.ConversationMessage{
			SessionID:      sessionID,
			MessageType:    msg.MessageType,
			Content:        msg.Content,
			ModelName:      msg.ModelName,
			TokensUsed:     msg.TokensUsed,
			ResponseTimeMs: msg.ResponseTimeMs,
			MessageOrder:   msg.MessageOrder,
		}
		if msg.ID != "" {
			message.Base.ID = msg.ID
		}
		if msg.AIConfigID != "" {
			message.AIConfigID = &msg.AIConfigID
		}

		database.DB.Save(&message)
	}

	c.JSON(http.StatusOK, gin.H{"message": "messages saved"})
}

type SaveComparisonRequest struct {
	Title             string `json:"title" binding:"required"`
	Description       string `json:"description"`
	SelectedAIConfigs string `json:"selected_ai_configs"`
	Rating            *int   `json:"rating"`
	Notes             string `json:"notes"`
	Ratings           string `json:"ratings"`
	NotesJSON         string `json:"notes_json"`
	ModelParameters   string `json:"model_parameters"`
}

func (h *ConversationHandler) SaveComparison(c *gin.Context) {
	sessionID := c.Param("id")
	var session model.ConversationSession
	if err := database.DB.First(&session, "id = ?", sessionID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}

	var req SaveComparisonRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	comparison := model.ConversationComparison{
		SessionID:         sessionID,
		Title:             req.Title,
		Description:       req.Description,
		SelectedAIConfigs: req.SelectedAIConfigs,
		Rating:            req.Rating,
		Notes:             req.Notes,
		Ratings:           req.Ratings,
		NotesJSON:         req.NotesJSON,
		ModelParameters:   req.ModelParameters,
	}

	if err := database.DB.Create(&comparison).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, comparison)
}

func (h *ConversationHandler) ListComparisons(c *gin.Context) {
	var comparisons []model.ConversationComparison
	if err := database.DB.Order("created_at DESC").Find(&comparisons).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, comparisons)
}
