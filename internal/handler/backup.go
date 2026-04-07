package handler

import (
	"compress/gzip"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/XimilalaXiang/prompt-manager/internal/database"
	"github.com/XimilalaXiang/prompt-manager/internal/model"
	"github.com/XimilalaXiang/prompt-manager/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/studio-b12/gowebdav"
)

type BackupHandler struct {
	dbPath string
	crypto *service.CryptoService
}

func NewBackupHandler(dbPath string, crypto *service.CryptoService) *BackupHandler {
	return &BackupHandler{dbPath: dbPath, crypto: crypto}
}

type WebDAVConfig struct {
	URL      string `json:"url"`
	Username string `json:"username"`
	Password string `json:"password"`
	Path     string `json:"path"`
}

func (h *BackupHandler) getWebDAVConfig() (*WebDAVConfig, error) {
	cfg := &WebDAVConfig{}

	var settings []model.AppSettings
	database.DB.Where("setting_key IN ?", []string{
		"webdav_url", "webdav_username", "webdav_password_encrypted", "webdav_path",
	}).Find(&settings)

	for _, s := range settings {
		switch s.SettingKey {
		case "webdav_url":
			cfg.URL = s.SettingValue
		case "webdav_username":
			cfg.Username = s.SettingValue
		case "webdav_password_encrypted":
			decrypted, err := h.crypto.Decrypt(s.SettingValue)
			if err != nil {
				return nil, fmt.Errorf("failed to decrypt WebDAV password")
			}
			cfg.Password = decrypted
		case "webdav_path":
			cfg.Path = s.SettingValue
		}
	}

	if cfg.URL == "" {
		return nil, fmt.Errorf("WebDAV URL not configured")
	}
	if cfg.Path == "" {
		cfg.Path = "/prompt-manager-backups"
	}

	return cfg, nil
}

func (h *BackupHandler) newClient(cfg *WebDAVConfig) *gowebdav.Client {
	c := gowebdav.NewClient(cfg.URL, cfg.Username, cfg.Password)
	c.SetTimeout(30 * time.Second)
	return c
}

type SaveConfigRequest struct {
	URL      string `json:"url" binding:"required"`
	Username string `json:"username"`
	Password string `json:"password"`
	Path     string `json:"path"`
}

func (h *BackupHandler) SaveConfig(c *gin.Context) {
	var req SaveConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	upsert := func(key, value string) error {
		var setting model.AppSettings
		result := database.DB.Where("setting_key = ?", key).First(&setting)
		if result.Error != nil {
			setting = model.AppSettings{SettingKey: key, SettingValue: value}
			return database.DB.Create(&setting).Error
		}
		setting.SettingValue = value
		return database.DB.Save(&setting).Error
	}

	if err := upsert("webdav_url", req.URL); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if err := upsert("webdav_username", req.Username); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if req.Password != "" {
		encrypted, err := h.crypto.Encrypt(req.Password)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to encrypt password"})
			return
		}
		if err := upsert("webdav_password_encrypted", encrypted); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	path := req.Path
	if path == "" {
		path = "/prompt-manager-backups"
	}
	if err := upsert("webdav_path", path); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "WebDAV config saved"})
}

func (h *BackupHandler) GetConfig(c *gin.Context) {
	var settings []model.AppSettings
	database.DB.Where("setting_key IN ?", []string{
		"webdav_url", "webdav_username", "webdav_path",
	}).Find(&settings)

	result := gin.H{"configured": false}
	for _, s := range settings {
		switch s.SettingKey {
		case "webdav_url":
			result["url"] = s.SettingValue
			result["configured"] = true
		case "webdav_username":
			result["username"] = s.SettingValue
		case "webdav_path":
			result["path"] = s.SettingValue
		}
	}

	var pwSetting model.AppSettings
	if database.DB.Where("setting_key = ?", "webdav_password_encrypted").First(&pwSetting).Error == nil {
		result["has_password"] = pwSetting.SettingValue != ""
	}

	c.JSON(http.StatusOK, result)
}

func (h *BackupHandler) TestConnection(c *gin.Context) {
	cfg, err := h.getWebDAVConfig()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	client := h.newClient(cfg)

	start := time.Now()
	err = client.MkdirAll(cfg.Path, 0755)
	latency := time.Since(start).Milliseconds()

	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"status":     "error",
			"message":    fmt.Sprintf("连接失败: %v", err),
			"latency_ms": latency,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":     "ok",
		"message":    fmt.Sprintf("连接成功 (%dms)", latency),
		"latency_ms": latency,
	})
}

func (h *BackupHandler) CreateBackup(c *gin.Context) {
	cfg, err := h.getWebDAVConfig()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tmpFile := filepath.Join(os.TempDir(), fmt.Sprintf("pm-backup-%d.db", time.Now().UnixNano()))
	defer os.Remove(tmpFile)

	sqlDB, err := database.DB.DB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "get database connection failed"})
		return
	}

	_, err = sqlDB.Exec(fmt.Sprintf("VACUUM INTO '%s'", tmpFile))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("database snapshot failed: %v", err)})
		return
	}

	gzFile := tmpFile + ".gz"
	defer os.Remove(gzFile)

	if err := compressFile(tmpFile, gzFile); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("compression failed: %v", err)})
		return
	}

	data, err := os.ReadFile(gzFile)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "read backup file failed"})
		return
	}

	client := h.newClient(cfg)
	_ = client.MkdirAll(cfg.Path, 0755)

	filename := fmt.Sprintf("backup-%s.db.gz", time.Now().Format("20060102-150405"))
	remotePath := cfg.Path + "/" + filename

	if err := client.Write(remotePath, data, 0644); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("upload failed: %v", err)})
		return
	}

	fi, _ := os.Stat(gzFile)
	c.JSON(http.StatusOK, gin.H{
		"message":  "备份成功",
		"filename": filename,
		"size":     fi.Size(),
	})
}

func (h *BackupHandler) ListBackups(c *gin.Context) {
	cfg, err := h.getWebDAVConfig()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	client := h.newClient(cfg)
	files, err := client.ReadDir(cfg.Path)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"backups": []interface{}{}})
		return
	}

	type BackupInfo struct {
		Name    string `json:"name"`
		Size    int64  `json:"size"`
		ModTime string `json:"mod_time"`
	}

	var backups []BackupInfo
	for _, f := range files {
		if f.IsDir() || !strings.HasSuffix(f.Name(), ".db.gz") {
			continue
		}
		backups = append(backups, BackupInfo{
			Name:    f.Name(),
			Size:    f.Size(),
			ModTime: f.ModTime().Format(time.RFC3339),
		})
	}

	sort.Slice(backups, func(i, j int) bool {
		return backups[i].ModTime > backups[j].ModTime
	})

	c.JSON(http.StatusOK, gin.H{"backups": backups})
}

func (h *BackupHandler) DeleteBackup(c *gin.Context) {
	name := c.Param("name")
	if name == "" || !strings.HasSuffix(name, ".db.gz") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid backup name"})
		return
	}

	cfg, err := h.getWebDAVConfig()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	client := h.newClient(cfg)
	if err := client.Remove(cfg.Path + "/" + name); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("delete failed: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "已删除"})
}

func (h *BackupHandler) RestoreBackup(c *gin.Context) {
	name := c.Param("name")
	if name == "" || !strings.HasSuffix(name, ".db.gz") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid backup name"})
		return
	}

	cfg, err := h.getWebDAVConfig()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	client := h.newClient(cfg)
	data, err := client.Read(cfg.Path + "/" + name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("download failed: %v", err)})
		return
	}

	tmpGz := filepath.Join(os.TempDir(), "pm-restore.db.gz")
	tmpDb := filepath.Join(os.TempDir(), "pm-restore.db")
	defer os.Remove(tmpGz)
	defer os.Remove(tmpDb)

	if err := os.WriteFile(tmpGz, data, 0644); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "write temp file failed"})
		return
	}

	if err := decompressFile(tmpGz, tmpDb); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("decompress failed: %v", err)})
		return
	}

	sqlDB, dbErr := database.DB.DB()
	if dbErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "get database connection failed"})
		return
	}
	sqlDB.Close()

	dbDir := filepath.Dir(h.dbPath)
	os.Remove(filepath.Join(dbDir, filepath.Base(h.dbPath)+"-shm"))
	os.Remove(filepath.Join(dbDir, filepath.Base(h.dbPath)+"-wal"))

	restoreData, err := os.ReadFile(tmpDb)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "read restored database failed"})
		return
	}

	if err := os.WriteFile(h.dbPath, restoreData, 0644); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("write database failed: %v", err)})
		return
	}

	if err := database.Init(h.dbPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("reinit database failed: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "恢复成功，数据库已重新加载"})
}

func compressFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	gz, err := gzip.NewWriterLevel(out, gzip.BestCompression)
	if err != nil {
		return err
	}
	defer gz.Close()

	_, err = io.Copy(gz, in)
	return err
}

func decompressFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	gz, err := gzip.NewReader(in)
	if err != nil {
		return err
	}
	defer gz.Close()

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, gz)
	return err
}
