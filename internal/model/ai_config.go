package model

type AIConfig struct {
	Base
	Name            string  `json:"name" gorm:"not null"`
	Provider        string  `json:"provider" gorm:"not null"` // openai, claude, gemini, custom
	APIEndpoint     string  `json:"api_endpoint" gorm:"not null"`
	Models          string  `json:"models" gorm:"type:text;default:'[]'"` // JSON array
	APIKeyEncrypted string  `json:"-" gorm:"type:text"`
	MaxTokens       int     `json:"max_tokens" gorm:"default:2000"`
	Temperature     float64 `json:"temperature" gorm:"default:0.7"`
	TopP            float64 `json:"top_p" gorm:"default:1.0"`
	IsActive        bool    `json:"is_active" gorm:"default:true"`
}
