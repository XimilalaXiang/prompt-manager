package router

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/XimilalaXiang/prompt-manager/internal/config"
	"github.com/XimilalaXiang/prompt-manager/internal/handler"
	"github.com/XimilalaXiang/prompt-manager/internal/middleware"
	"github.com/XimilalaXiang/prompt-manager/internal/service"
	"github.com/gin-gonic/gin"
)

func Setup(cfg *config.Config) *gin.Engine {
	gin.SetMode(cfg.GinMode)

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.LoggerMiddleware())
	r.Use(middleware.CORSMiddleware(cfg.CORSOrigins))

	cryptoSvc := service.NewCryptoService(cfg.EncryptionKey)
	aiProxy := service.NewAIProxyService(cryptoSvc)
	jwtSvc := middleware.NewJWTService(cfg.JWTSecret, cfg.JWTAccessExpiry, cfg.JWTRefreshExpiry)

	authHandler := handler.NewAuthHandler(jwtSvc)
	categoryHandler := handler.NewCategoryHandler()
	promptHandler := handler.NewPromptHandler()
	aiConfigHandler := handler.NewAIConfigHandler(cryptoSvc)
	knowledgeHandler := handler.NewKnowledgeHandler()
	compareHandler := handler.NewCompareHandler(aiProxy, cryptoSvc)
	conversationHandler := handler.NewConversationHandler()
	importExportHandler := handler.NewImportExportHandler(cryptoSvc)
	settingsHandler := handler.NewSettingsHandler()

	api := r.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.GET("/status", authHandler.Status)
			auth.POST("/setup", authHandler.Setup)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.Refresh)
		}

		protected := api.Group("")
		protected.Use(jwtSvc.AuthMiddleware())
		{
			categories := protected.Group("/categories")
			{
				categories.GET("", categoryHandler.List)
				categories.GET("/:id", categoryHandler.Get)
				categories.POST("", categoryHandler.Create)
				categories.PUT("/:id", categoryHandler.Update)
				categories.DELETE("/:id", categoryHandler.Delete)
			}

			prompts := protected.Group("/prompts")
			{
				prompts.GET("", promptHandler.List)
				prompts.GET("/:id", promptHandler.Get)
				prompts.POST("", promptHandler.Create)
				prompts.PUT("/:id", promptHandler.Update)
				prompts.DELETE("/:id", promptHandler.Delete)
				prompts.POST("/:id/favorite", promptHandler.ToggleFavorite)
				prompts.GET("/:id/versions", promptHandler.Versions)
				prompts.POST("/:id/rollback/:version", promptHandler.Rollback)
			}

			aiConfigs := protected.Group("/ai-configs")
			{
				aiConfigs.GET("", aiConfigHandler.List)
				aiConfigs.GET("/:id", aiConfigHandler.Get)
				aiConfigs.POST("", aiConfigHandler.Create)
				aiConfigs.PUT("/:id", aiConfigHandler.Update)
				aiConfigs.DELETE("/:id", aiConfigHandler.Delete)
				aiConfigs.POST("/:id/test", aiConfigHandler.Test)
			aiConfigs.POST("/fetch-models", aiConfigHandler.FetchModels)
			}

			compare := protected.Group("/compare")
			{
				compare.POST("/send", compareHandler.Send)
				compare.POST("/stream", compareHandler.Stream)
				compare.POST("/rate", compareHandler.Rate)
			}

			conversations := protected.Group("/conversations")
			{
				conversations.GET("", conversationHandler.ListSessions)
				conversations.GET("/:id", conversationHandler.GetSession)
				conversations.POST("", conversationHandler.CreateSession)
				conversations.PUT("/:id", conversationHandler.UpdateSession)
				conversations.DELETE("/:id", conversationHandler.DeleteSession)
				conversations.POST("/:id/messages", conversationHandler.SaveMessages)
				conversations.POST("/:id/comparisons", conversationHandler.SaveComparison)
			}

			comparisons := protected.Group("/comparisons")
			{
				comparisons.GET("", conversationHandler.ListComparisons)
			}

			knowledge := protected.Group("/knowledge")
			{
				knowledge.GET("", knowledgeHandler.List)
				knowledge.GET("/:id", knowledgeHandler.Get)
				knowledge.POST("", knowledgeHandler.Create)
				knowledge.PUT("/:id", knowledgeHandler.Update)
				knowledge.DELETE("/:id", knowledgeHandler.Delete)
				knowledge.POST("/:id/favorite", knowledgeHandler.ToggleFavorite)
				knowledge.POST("/:id/archive", knowledgeHandler.ToggleArchive)
			}

			ie := protected.Group("/export")
			{
				ie.GET("/prompts", importExportHandler.ExportPrompts)
				ie.GET("/ai-configs", importExportHandler.ExportAIConfigs)
			}

			imp := protected.Group("/import")
			{
				imp.POST("/prompts", importExportHandler.ImportPrompts)
				imp.POST("/ai-configs", importExportHandler.ImportAIConfigs)
			}

			settings := protected.Group("/settings")
			{
				settings.GET("", settingsHandler.List)
				settings.GET("/:key", settingsHandler.Get)
				settings.POST("", settingsHandler.Upsert)
				settings.DELETE("/:key", settingsHandler.Delete)
			}
		}
	}

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Serve frontend static files
	distDir := "./web/dist"
	if _, err := os.Stat(distDir); err == nil {
		r.Static("/assets", filepath.Join(distDir, "assets"))

		r.NoRoute(func(c *gin.Context) {
			if strings.HasPrefix(c.Request.URL.Path, "/api/") {
				c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
				return
			}
			c.File(filepath.Join(distDir, "index.html"))
		})
	}

	return r
}
