package model

type AppSettings struct {
	Base
	SettingKey   string `json:"setting_key" gorm:"uniqueIndex;not null"`
	SettingValue string `json:"setting_value" gorm:"not null"`
}
