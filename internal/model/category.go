package model

type Category struct {
	Base
	Name        string `json:"name" gorm:"not null"`
	Description string `json:"description"`
	Color       string `json:"color" gorm:"default:'#3B82F6'"`
}
