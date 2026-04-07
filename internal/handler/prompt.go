package handler

import (
	"net/http"
	"strconv"

	"github.com/XimilalaXiang/prompt-manager/internal/database"
	"github.com/XimilalaXiang/prompt-manager/internal/model"
	"github.com/gin-gonic/gin"
)

type PromptHandler struct{}

func NewPromptHandler() *PromptHandler {
	return &PromptHandler{}
}

func (h *PromptHandler) List(c *gin.Context) {
	promptType := c.Query("type")
	categoryID := c.Query("category_id")
	search := c.Query("search")
	favorite := c.Query("favorite")

	query := database.DB.Preload("Category").Order("updated_at DESC")

	if promptType != "" {
		query = query.Where("prompt_type = ?", promptType)
	}
	if categoryID != "" {
		query = query.Where("category_id = ?", categoryID)
	}
	if search != "" {
		query = query.Where("title LIKE ? OR content LIKE ? OR description LIKE ?",
			"%"+search+"%", "%"+search+"%", "%"+search+"%")
	}
	if favorite == "true" {
		query = query.Where("is_favorite = ?", true)
	}

	var prompts []model.Prompt
	if err := query.Find(&prompts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, prompts)
}

func (h *PromptHandler) Get(c *gin.Context) {
	id := c.Param("id")
	var prompt model.Prompt
	if err := database.DB.Preload("Category").First(&prompt, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "prompt not found"})
		return
	}
	c.JSON(http.StatusOK, prompt)
}

type CreatePromptRequest struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	Content     string `json:"content" binding:"required"`
	CategoryID  string `json:"category_id"`
	Tags        string `json:"tags"`
	PromptType  string `json:"prompt_type"`
}

func (h *PromptHandler) Create(c *gin.Context) {
	var req CreatePromptRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	prompt := model.Prompt{
		Title:       req.Title,
		Description: req.Description,
		Content:     req.Content,
		Tags:        req.Tags,
		PromptType:  req.PromptType,
	}
	if prompt.PromptType == "" {
		prompt.PromptType = "user"
	}
	if req.CategoryID != "" {
		prompt.CategoryID = &req.CategoryID
	}

	if err := database.DB.Create(&prompt).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	version := model.PromptVersion{
		PromptID:          prompt.ID,
		VersionNumber:     1,
		Content:           prompt.Content,
		ChangeDescription: "Initial version",
	}
	database.DB.Create(&version)

	database.DB.Preload("Category").First(&prompt, "id = ?", prompt.ID)
	c.JSON(http.StatusCreated, prompt)
}

func (h *PromptHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var prompt model.Prompt
	if err := database.DB.First(&prompt, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "prompt not found"})
		return
	}

	var req CreatePromptRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	contentChanged := prompt.Content != req.Content

	prompt.Title = req.Title
	prompt.Description = req.Description
	prompt.Content = req.Content
	prompt.Tags = req.Tags
	if req.PromptType != "" {
		prompt.PromptType = req.PromptType
	}
	if req.CategoryID != "" {
		prompt.CategoryID = &req.CategoryID
	} else {
		prompt.CategoryID = nil
	}

	if err := database.DB.Save(&prompt).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if contentChanged {
		var maxVersion int
		database.DB.Model(&model.PromptVersion{}).
			Where("prompt_id = ?", id).
			Select("COALESCE(MAX(version_number), 0)").
			Scan(&maxVersion)

		version := model.PromptVersion{
			PromptID:          id,
			VersionNumber:     maxVersion + 1,
			Content:           req.Content,
			ChangeDescription: c.Query("change_description"),
		}
		database.DB.Create(&version)
	}

	database.DB.Preload("Category").First(&prompt, "id = ?", prompt.ID)
	c.JSON(http.StatusOK, prompt)
}

func (h *PromptHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	database.DB.Where("prompt_id = ?", id).Delete(&model.PromptVersion{})
	if err := database.DB.Delete(&model.Prompt{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

func (h *PromptHandler) ToggleFavorite(c *gin.Context) {
	id := c.Param("id")
	var prompt model.Prompt
	if err := database.DB.First(&prompt, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "prompt not found"})
		return
	}

	prompt.IsFavorite = !prompt.IsFavorite
	database.DB.Save(&prompt)
	c.JSON(http.StatusOK, prompt)
}

func (h *PromptHandler) Versions(c *gin.Context) {
	id := c.Param("id")
	var versions []model.PromptVersion
	if err := database.DB.Where("prompt_id = ?", id).Order("version_number DESC").Find(&versions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, versions)
}

func (h *PromptHandler) Rollback(c *gin.Context) {
	promptID := c.Param("id")
	versionStr := c.Param("version")
	versionNum, err := strconv.Atoi(versionStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid version number"})
		return
	}

	var version model.PromptVersion
	if err := database.DB.Where("prompt_id = ? AND version_number = ?", promptID, versionNum).First(&version).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "version not found"})
		return
	}

	var prompt model.Prompt
	if err := database.DB.First(&prompt, "id = ?", promptID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "prompt not found"})
		return
	}

	prompt.Content = version.Content
	database.DB.Save(&prompt)

	var maxVersion int
	database.DB.Model(&model.PromptVersion{}).
		Where("prompt_id = ?", promptID).
		Select("COALESCE(MAX(version_number), 0)").
		Scan(&maxVersion)

	newVersion := model.PromptVersion{
		PromptID:          promptID,
		VersionNumber:     maxVersion + 1,
		Content:           version.Content,
		ChangeDescription: "Rollback to version " + versionStr,
	}
	database.DB.Create(&newVersion)

	database.DB.Preload("Category").First(&prompt, "id = ?", prompt.ID)
	c.JSON(http.StatusOK, prompt)
}
