package handler

import (
	"net/http"

	"github.com/XimilalaXiang/prompt-manager/internal/database"
	"github.com/XimilalaXiang/prompt-manager/internal/model"
	"github.com/gin-gonic/gin"
)

type SettingsHandler struct{}

func NewSettingsHandler() *SettingsHandler {
	return &SettingsHandler{}
}

func (h *SettingsHandler) Get(c *gin.Context) {
	key := c.Param("key")
	var setting model.AppSettings
	if err := database.DB.Where("setting_key = ?", key).First(&setting).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "setting not found"})
		return
	}
	c.JSON(http.StatusOK, setting)
}

func (h *SettingsHandler) List(c *gin.Context) {
	var settings []model.AppSettings
	query := database.DB.Order("setting_key ASC")

	// Filter out sensitive settings
	query = query.Where("setting_key NOT IN ?", []string{"password_hash"})

	if err := query.Find(&settings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, settings)
}

type UpsertSettingRequest struct {
	Key   string `json:"key" binding:"required"`
	Value string `json:"value" binding:"required"`
}

func (h *SettingsHandler) Upsert(c *gin.Context) {
	var req UpsertSettingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Key == "password_hash" {
		c.JSON(http.StatusForbidden, gin.H{"error": "cannot modify password through this endpoint"})
		return
	}

	var setting model.AppSettings
	result := database.DB.Where("setting_key = ?", req.Key).First(&setting)
	if result.Error != nil {
		setting = model.AppSettings{
			SettingKey:   req.Key,
			SettingValue: req.Value,
		}
		if err := database.DB.Create(&setting).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	} else {
		setting.SettingValue = req.Value
		if err := database.DB.Save(&setting).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	c.JSON(http.StatusOK, setting)
}

func (h *SettingsHandler) Delete(c *gin.Context) {
	key := c.Param("key")

	if key == "password_hash" {
		c.JSON(http.StatusForbidden, gin.H{"error": "cannot delete password"})
		return
	}

	if err := database.DB.Where("setting_key = ?", key).Delete(&model.AppSettings{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
