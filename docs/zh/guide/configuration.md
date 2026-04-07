# 配置说明

所有配置通过环境变量完成。在 `docker-compose.yml` 中设置或使用 `docker run -e` 传入。

## 环境变量

| 变量 | 默认值 | 必填 | 说明 |
|---|---|---|---|
| `PORT` | `8080` | 否 | 服务监听端口 |
| `GIN_MODE` | `release` | 否 | `debug` 详细日志，`release` 生产模式 |
| `JWT_SECRET` | — | **是** | JWT 签名密钥，至少 32 个字符的随机字符串 |
| `JWT_ACCESS_EXPIRY` | `15m` | 否 | Access Token 有效期（Go duration 格式） |
| `JWT_REFRESH_EXPIRY` | `168h` | 否 | Refresh Token 有效期（默认 7 天） |
| `ENCRYPTION_KEY` | — | **是** | 64 位十六进制字符串，用于 AES-256-GCM 加密 API 密钥 |
| `DB_PATH` | `/app/data/prompt-manager.db` | 否 | SQLite 数据库文件路径 |
| `CORS_ORIGINS` | `http://localhost:3000` | 否 | 允许的 CORS 来源（逗号分隔） |

## 生成密钥

### JWT Secret

```bash
openssl rand -base64 32
```

### Encryption Key

```bash
openssl rand -hex 32
```

## 安全注意事项

- 生产环境务必修改 `JWT_SECRET` 和 `ENCRYPTION_KEY` 的默认值
- `ENCRYPTION_KEY` 用于 AES-256-GCM 加密存储的 API 密钥
- 密码使用 bcrypt 哈希（cost factor 10），明文不会被存储
- JWT Access Token 短期有效（默认 15 分钟），Refresh Token 有效期 7 天
