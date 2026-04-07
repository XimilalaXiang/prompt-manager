# Prompt Manager

[中文文档](./README_CN.md) | [Documentation](https://ximilalaxiang.github.io/prompt-manager/)

A self-hosted prompt management tool for AI power users. Manage prompts, compare AI models side-by-side, and organize your AI workflow — all in a single Docker container.

![Go](https://img.shields.io/badge/Go-1.25-00ADD8?logo=go&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-WAL-003B57?logo=sqlite&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/github/license/XimilalaXiang/prompt-manager)

## Features

- **Prompt CRUD** — Create, edit, delete, search, and favorite prompts with category support
- **Version History** — Every edit is versioned; roll back to any previous version
- **Multi-Model Comparison** — Send the same prompt to multiple AI models and compare responses side-by-side
- **SSE Streaming** — Real-time streaming responses via Server-Sent Events
- **AI Auto-Rating** — Let AI score and compare model responses automatically
- **Knowledge Base** — Store reference articles and notes alongside your prompts
- **Conversation Management** — Save and revisit AI conversation sessions
- **Import / Export** — Backup and restore prompts and AI configs as JSON
- **Encrypted API Keys** — AES-256-GCM encryption for all stored API keys
- **JWT Authentication** — Secure access with username/password, access + refresh tokens
- **Self-Hosted** — Single Docker image (~20MB), SQLite database, zero external dependencies
- **Multi-Arch** — Supports linux/amd64 and linux/arm64

## Quick Start

### Docker Compose (Recommended)

```bash
mkdir prompt-manager && cd prompt-manager

cat > docker-compose.yml << 'EOF'
services:
  prompt-manager:
    image: ghcr.io/ximilalaxiang/prompt-manager:latest
    container_name: prompt-manager
    restart: unless-stopped
    ports:
      - "8080:8080"
    volumes:
      - ./data:/app/data
    environment:
      - JWT_SECRET=change-this-to-a-random-secret
      - ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
EOF

docker compose up -d
```

Open `http://localhost:8080` in your browser. On first visit, you'll be prompted to create an admin account.

### Docker Run

```bash
docker run -d \
  --name prompt-manager \
  -p 8080:8080 \
  -v ./data:/app/data \
  -e JWT_SECRET=change-this-to-a-random-secret \
  -e ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef \
  ghcr.io/ximilalaxiang/prompt-manager:latest
```

## Configuration

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8080` | Server port |
| `GIN_MODE` | `release` | Gin mode (`debug` / `release`) |
| `JWT_SECRET` | (required) | Secret key for JWT signing |
| `JWT_ACCESS_EXPIRY` | `15m` | Access token expiry |
| `JWT_REFRESH_EXPIRY` | `168h` | Refresh token expiry (7 days) |
| `ENCRYPTION_KEY` | (required) | 64-char hex string for AES-256-GCM encryption |
| `DB_PATH` | `/app/data/prompt-manager.db` | SQLite database file path |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed CORS origins (comma-separated) |

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Go 1.25, Gin, GORM |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Database | SQLite (WAL mode) |
| Auth | JWT (access + refresh tokens), bcrypt |
| Encryption | AES-256-GCM |
| Streaming | Server-Sent Events (SSE) |
| Container | Multi-stage Docker build, Alpine Linux |
| CI/CD | GitHub Actions → GHCR |

## Development

### Prerequisites

- Go 1.25+
- Node.js 20+
- npm

### Backend

```bash
cp .env.example .env
go run ./cmd/server
```

### Frontend

```bash
cd web
npm install
npm run dev
```

The frontend dev server runs on `http://localhost:5173` and proxies API requests to `http://localhost:8080`.

## API Overview

All API endpoints are under `/api`. Authentication endpoints are public; all others require a JWT bearer token.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/auth/status` | Check if admin is configured |
| POST | `/api/auth/setup` | Create admin account (first-time only) |
| POST | `/api/auth/login` | Login and get tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/categories` | List categories |
| POST | `/api/categories` | Create category |
| GET | `/api/prompts` | List prompts (search, filter, paginate) |
| POST | `/api/prompts` | Create prompt |
| GET | `/api/prompts/:id/versions` | Get version history |
| POST | `/api/prompts/:id/rollback/:version` | Rollback to version |
| GET | `/api/ai-configs` | List AI configurations |
| POST | `/api/ai-configs/:id/test` | Test AI connection |
| POST | `/api/compare/send` | Multi-model comparison |
| POST | `/api/compare/stream` | Streaming comparison (SSE) |
| POST | `/api/compare/rate` | AI auto-rating |
| GET | `/api/knowledge` | List knowledge articles |
| GET | `/api/conversations` | List conversation sessions |
| GET | `/api/export/prompts` | Export prompts as JSON |
| POST | `/api/import/prompts` | Import prompts from JSON |
| GET | `/api/settings` | List settings |
| GET | `/health` | Health check |

## License

MIT
