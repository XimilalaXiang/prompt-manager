package model

type ConversationSession struct {
	Base
	Title               string `json:"title" gorm:"not null"`
	SystemPromptID      *string `json:"system_prompt_id" gorm:"type:text"`
	SystemPromptContent string `json:"system_prompt_content"`
	ModelParameters     string `json:"model_parameters" gorm:"type:text;default:'{}'"`
}

type ConversationMessage struct {
	Base
	SessionID      string `json:"session_id" gorm:"not null;index"`
	MessageType    string `json:"message_type" gorm:"not null"` // "user" or "assistant"
	Content        string `json:"content" gorm:"not null"`
	AIConfigID     *string `json:"ai_config_id" gorm:"type:text"`
	ModelName      string `json:"model_name"`
	TokensUsed     *int   `json:"tokens_used"`
	ResponseTimeMs *int   `json:"response_time_ms"`
	MessageOrder   int    `json:"message_order" gorm:"not null"`
}

type ConversationComparison struct {
	Base
	SessionID         string `json:"session_id" gorm:"not null;index"`
	Title             string `json:"title" gorm:"not null"`
	Description       string `json:"description"`
	SelectedAIConfigs string `json:"selected_ai_configs" gorm:"type:text;default:'[]'"` // JSON array
	Rating            *int   `json:"rating"`
	Notes             string `json:"notes"`
	Ratings           string `json:"ratings" gorm:"type:text;default:'{}'"`    // JSON object
	NotesJSON         string `json:"notes_json" gorm:"type:text;default:'{}'"` // JSON object
	ModelParameters   string `json:"model_parameters" gorm:"type:text;default:'{}'"`
}
