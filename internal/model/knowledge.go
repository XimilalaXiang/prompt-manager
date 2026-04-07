package model

type KnowledgeArticle struct {
	Base
	Title       string    `json:"title" gorm:"not null"`
	Content     string    `json:"content" gorm:"not null"`
	Description string    `json:"description"`
	CategoryID  *string   `json:"category_id" gorm:"type:text"`
	Category    *Category `json:"category,omitempty" gorm:"foreignKey:CategoryID"`
	Tags        string    `json:"tags" gorm:"type:text;default:''"` // JSON array
	Author      string    `json:"author"`
	SourceURL   string    `json:"source_url"`
	WordCount   int       `json:"word_count" gorm:"default:0"`
	ReadingTime int       `json:"reading_time" gorm:"default:0"`
	IsFavorite  bool      `json:"is_favorite" gorm:"default:false"`
	IsArchived  bool      `json:"is_archived" gorm:"default:false"`
}
