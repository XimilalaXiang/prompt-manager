# Configuration

All configuration is done via environment variables. Set them in your `docker-compose.yml` or pass them with `-e` when using `docker run`.

## Environment Variables

| Variable | Default | Required | Description |
|---|---|---|---|
| `PORT` | `8080` | No | Server listen port |
| `GIN_MODE` | `release` | No | `debug` for verbose logging, `release` for production |
| `JWT_SECRET` | — | **Yes** | Secret key for signing JWT tokens. Use a random string of at least 32 characters |
| `JWT_ACCESS_EXPIRY` | `15m` | No | Access token lifetime (Go duration format) |
| `JWT_REFRESH_EXPIRY` | `168h` | No | Refresh token lifetime (default: 7 days) |
| `ENCRYPTION_KEY` | — | **Yes** | 64-character hex string for AES-256-GCM encryption of API keys |
| `DB_PATH` | `/app/data/prompt-manager.db` | No | Path to SQLite database file |
| `CORS_ORIGINS` | `http://localhost:3000` | No | Comma-separated list of allowed CORS origins |

## Generating Secrets

### JWT Secret

```bash
openssl rand -base64 32
```

### Encryption Key

```bash
openssl rand -hex 32
```

## Example `.env` File

```env
PORT=8080
GIN_MODE=release
JWT_SECRET=your-random-secret-here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=168h
ENCRYPTION_KEY=your-64-char-hex-encryption-key
DB_PATH=/app/data/prompt-manager.db
CORS_ORIGINS=http://localhost:3000
```

## Security Notes

- Always change `JWT_SECRET` and `ENCRYPTION_KEY` from their defaults in production
- The `ENCRYPTION_KEY` is used to encrypt stored API keys with AES-256-GCM
- Passwords are hashed with bcrypt (cost factor 10) and never stored in plain text
- JWT access tokens are short-lived (15 min default); refresh tokens last 7 days
