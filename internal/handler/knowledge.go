package handler

import (
	"net/http"
	"strings"
	"unicode/utf8"

	"github.com/XimilalaXiang/prompt-manager/internal/database"
	"github.com/XimilalaXiang/prompt-manager/internal/model"
	"github.com/gin-gonic/gin"
)

type KnowledgeHandler struct{}

func NewKnowledgeHandler() *KnowledgeHandler {
	return &KnowledgeHandler{}
}

func (h *KnowledgeHandler) List(c *gin.Context) {
	categoryID := c.Query("category_id")
	search := c.Query("search")
	favorite := c.Query("favorite")
	archived := c.Query("archived")

	query := database.DB.Preload("Category").Order("updated_at DESC")

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
	if archived == "true" {
		query = query.Where("is_archived = ?", true)
	} else {
		query = query.Where("is_archived = ?", false)
	}

	var articles []model.KnowledgeArticle
	if err := query.Find(&articles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, articles)
}

func (h *KnowledgeHandler) Get(c *gin.Context) {
	id := c.Param("id")
	var article model.KnowledgeArticle
	if err := database.DB.Preload("Category").First(&article, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "article not found"})
		return
	}
	c.JSON(http.StatusOK, article)
}

type CreateKnowledgeRequest struct {
	Title       string `json:"title" binding:"required"`
	Content     string `json:"content" binding:"required"`
	Description string `json:"description"`
	CategoryID  string `json:"category_id"`
	Tags        string `json:"tags"`
	Author      string `json:"author"`
	SourceURL   string `json:"source_url"`
}

func calcReadingTime(content string) (wordCount int, readingTime int) {
	wordCount = utf8.RuneCountInString(strings.TrimSpace(content))
	readingTime = wordCount / 300 // ~300 chars per minute for Chinese
	if readingTime < 1 {
		readingTime = 1
	}
	return
}

func (h *KnowledgeHandler) Create(c *gin.Context) {
	var req CreateKnowledgeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	wordCount, readingTime := calcReadingTime(req.Content)

	article := model.KnowledgeArticle{
		Title:       req.Title,
		Content:     req.Content,
		Description: req.Description,
		Tags:        req.Tags,
		Author:      req.Author,
		SourceURL:   req.SourceURL,
		WordCount:   wordCount,
		ReadingTime: readingTime,
	}
	if req.CategoryID != "" {
		article.CategoryID = &req.CategoryID
	}

	if err := database.DB.Create(&article).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	database.DB.Preload("Category").First(&article, "id = ?", article.ID)
	c.JSON(http.StatusCreated, article)
}

func (h *KnowledgeHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var article model.KnowledgeArticle
	if err := database.DB.First(&article, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "article not found"})
		return
	}

	var req CreateKnowledgeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	wordCount, readingTime := calcReadingTime(req.Content)

	article.Title = req.Title
	article.Content = req.Content
	article.Description = req.Description
	article.Tags = req.Tags
	article.Author = req.Author
	article.SourceURL = req.SourceURL
	article.WordCount = wordCount
	article.ReadingTime = readingTime
	if req.CategoryID != "" {
		article.CategoryID = &req.CategoryID
	} else {
		article.CategoryID = nil
	}

	if err := database.DB.Save(&article).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	database.DB.Preload("Category").First(&article, "id = ?", article.ID)
	c.JSON(http.StatusOK, article)
}

func (h *KnowledgeHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := database.DB.Delete(&model.KnowledgeArticle{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

func (h *KnowledgeHandler) ToggleFavorite(c *gin.Context) {
	id := c.Param("id")
	var article model.KnowledgeArticle
	if err := database.DB.First(&article, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "article not found"})
		return
	}
	article.IsFavorite = !article.IsFavorite
	database.DB.Save(&article)
	c.JSON(http.StatusOK, article)
}

func (h *KnowledgeHandler) ToggleArchive(c *gin.Context) {
	id := c.Param("id")
	var article model.KnowledgeArticle
	if err := database.DB.First(&article, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "article not found"})
		return
	}
	article.IsArchived = !article.IsArchived
	database.DB.Save(&article)
	c.JSON(http.StatusOK, article)
}
