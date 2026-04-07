package model

type Prompt struct {
	Base
	Title       string    `json:"title" gorm:"not null"`
	Description string    `json:"description"`
	Content     string    `json:"content" gorm:"not null"`
	CategoryID  *string   `json:"category_id" gorm:"type:text"`
	Category    *Category `json:"category,omitempty" gorm:"foreignKey:CategoryID"`
	Tags        string    `json:"tags" gorm:"type:text;default:''"` // JSON array stored as string
	IsFavorite  bool      `json:"is_favorite" gorm:"default:false"`
	PromptType  string    `json:"prompt_type" gorm:"not null;default:'user'"` // "user" or "system"
}

type PromptVersion struct {
	Base
	PromptID          string `json:"prompt_id" gorm:"not null;index"`
	Prompt            Prompt `json:"-" gorm:"foreignKey:PromptID"`
	VersionNumber     int    `json:"version_number" gorm:"not null"`
	Content           string `json:"content" gorm:"not null"`
	ChangeDescription string `json:"change_description"`
}
