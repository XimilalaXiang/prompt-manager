package database

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/XimilalaXiang/prompt-manager/internal/model"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Init(dbPath string) error {
	dir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("create data directory: %w", err)
	}

	var err error
	DB, err = gorm.Open(sqlite.Open(dbPath+"?_journal_mode=WAL&_busy_timeout=5000&_foreign_keys=ON"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		return fmt.Errorf("open database: %w", err)
	}

	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("get sql.DB: %w", err)
	}
	sqlDB.SetMaxOpenConns(1)
	sqlDB.SetMaxIdleConns(1)

	if err := migrate(); err != nil {
		return fmt.Errorf("migrate: %w", err)
	}

	if err := seed(); err != nil {
		return fmt.Errorf("seed: %w", err)
	}

	log.Println("Database initialized successfully")
	return nil
}

func migrate() error {
	return DB.AutoMigrate(
		&model.Category{},
		&model.Prompt{},
		&model.PromptVersion{},
		&model.AIConfig{},
		&model.PromptResult{},
		&model.ConversationSession{},
		&model.ConversationMessage{},
		&model.ConversationComparison{},
		&model.KnowledgeArticle{},
		&model.AppSettings{},
	)
}

func seed() error {
	var count int64
	DB.Model(&model.Category{}).Count(&count)
	if count > 0 {
		return nil
	}

	categories := []model.Category{
		{Base: model.Base{ID: "cat-general"}, Name: "通用", Description: "通用提示词", Color: "#3B82F6"},
		{Base: model.Base{ID: "cat-writing"}, Name: "写作", Description: "写作相关提示词", Color: "#10B981"},
		{Base: model.Base{ID: "cat-coding"}, Name: "编程", Description: "编程相关提示词", Color: "#F59E0B"},
		{Base: model.Base{ID: "cat-analysis"}, Name: "分析", Description: "数据分析提示词", Color: "#EF4444"},
		{Base: model.Base{ID: "cat-creative"}, Name: "创意", Description: "创意设计提示词", Color: "#8B5CF6"},
	}

	for _, c := range categories {
		if err := DB.Create(&c).Error; err != nil {
			log.Printf("Seed category %s: %v", c.Name, err)
		}
	}

	log.Println("Default categories seeded")
	return nil
}
