package model

type PromptResult struct {
	Base
	PromptID            string    `json:"prompt_id" gorm:"not null;index"`
	AIConfigID          string    `json:"ai_config_id" gorm:"not null;index"`
	AIConfig            *AIConfig `json:"ai_config,omitempty" gorm:"foreignKey:AIConfigID"`
	InputContent        string    `json:"input_content" gorm:"not null"`
	OutputContent       string    `json:"output_content" gorm:"not null"`
	SystemPromptID      *string   `json:"system_prompt_id" gorm:"type:text"`
	SystemPromptContent string    `json:"system_prompt_content"`
	ModelName           string    `json:"model_name"`
	TokensUsed          *int      `json:"tokens_used"`
	ResponseTimeMs      *int      `json:"response_time_ms"`
	Rating              *int      `json:"rating"`
	Notes               string    `json:"notes"`
}
