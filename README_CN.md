# Prompt Manager

[English](./README.md) | [在线文档](https://ximilalaxiang.github.io/prompt-manager/)

一个自托管的 AI 提示词管理工具。管理提示词、多模型对比、组织 AI 工作流 —— 全部打包在一个 Docker 容器中。

![Go](https://img.shields.io/badge/Go-1.25-00ADD8?logo=go&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-WAL-003B57?logo=sqlite&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/github/license/XimilalaXiang/prompt-manager)

## 功能特性

- **提示词管理** — 创建、编辑、删除、搜索、收藏提示词，支持分类管理
- **版本历史** — 每次编辑自动保存版本，可回滚到任意历史版本
- **多模型对比** — 将同一提示词发送给多个 AI 模型，并排对比响应结果
- **SSE 流式传输** — 通过 Server-Sent Events 实时流式传输 AI 响应
- **AI 自动评分** — 让 AI 自动对模型响应进行评分和对比
- **知识库** — 在提示词旁存储参考文章和笔记
- **对话管理** — 保存和回顾 AI 对话会话
- **导入/导出** — 以 JSON 格式备份和恢复提示词及 AI 配置
- **API 密钥加密** — 所有存储的 API 密钥使用 AES-256-GCM 加密
- **JWT 认证** — 用户名/密码认证，access + refresh 双 token 机制
- **自托管** — 单个 Docker 镜像（约 20MB），SQLite 数据库，零外部依赖
- **多架构** — 支持 linux/amd64 和 linux/arm64

## 快速开始

### Docker Compose（推荐）

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
      - JWT_SECRET=请替换为随机密钥
      - ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
EOF

docker compose up -d
```

在浏览器打开 `http://localhost:8080`。首次访问时会提示创建管理员账户。

### Docker Run

```bash
docker run -d \
  --name prompt-manager \
  -p 8080:8080 \
  -v ./data:/app/data \
  -e JWT_SECRET=请替换为随机密钥 \
  -e ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef \
  ghcr.io/ximilalaxiang/prompt-manager:latest
```

## 配置项

| 变量 | 默认值 | 说明 |
|---|---|---|
| `PORT` | `8080` | 服务端口 |
| `GIN_MODE` | `release` | Gin 模式（`debug` / `release`） |
| `JWT_SECRET` | （必填） | JWT 签名密钥 |
| `JWT_ACCESS_EXPIRY` | `15m` | Access Token 有效期 |
| `JWT_REFRESH_EXPIRY` | `168h` | Refresh Token 有效期（7 天） |
| `ENCRYPTION_KEY` | （必填） | 64 位十六进制字符串，用于 AES-256-GCM 加密 |
| `DB_PATH` | `/app/data/prompt-manager.db` | SQLite 数据库文件路径 |
| `CORS_ORIGINS` | `http://localhost:3000` | 允许的 CORS 来源（逗号分隔） |

## 技术栈

| 层 | 技术 |
|---|---|
| 后端 | Go 1.25、Gin、GORM |
| 前端 | React 18、TypeScript、Vite、Tailwind CSS |
| 数据库 | SQLite（WAL 模式） |
| 认证 | JWT（access + refresh token）、bcrypt |
| 加密 | AES-256-GCM |
| 流式传输 | Server-Sent Events（SSE） |
| 容器 | 多阶段 Docker 构建、Alpine Linux |
| CI/CD | GitHub Actions → GHCR |

## 本地开发

### 前置条件

- Go 1.25+
- Node.js 20+
- npm

### 后端

```bash
cp .env.example .env
go run ./cmd/server
```

### 前端

```bash
cd web
npm install
npm run dev
```

前端开发服务器运行在 `http://localhost:5173`，API 请求会代理到 `http://localhost:8080`。

## API 概览

所有 API 端点位于 `/api` 下。认证端点公开访问，其余端点需要 JWT Bearer Token。

| 方法 | 端点 | 说明 |
|---|---|---|
| GET | `/api/auth/status` | 检查是否已配置管理员 |
| POST | `/api/auth/setup` | 创建管理员账户（仅首次） |
| POST | `/api/auth/login` | 登录获取 token |
| POST | `/api/auth/refresh` | 刷新 access token |
| GET | `/api/categories` | 获取分类列表 |
| POST | `/api/categories` | 创建分类 |
| GET | `/api/prompts` | 获取提示词列表（搜索/筛选/分页） |
| POST | `/api/prompts` | 创建提示词 |
| GET | `/api/prompts/:id/versions` | 获取版本历史 |
| POST | `/api/prompts/:id/rollback/:version` | 回滚到指定版本 |
| GET | `/api/ai-configs` | 获取 AI 配置列表 |
| POST | `/api/ai-configs/:id/test` | 测试 AI 连接 |
| POST | `/api/compare/send` | 多模型对比 |
| POST | `/api/compare/stream` | 流式对比（SSE） |
| POST | `/api/compare/rate` | AI 自动评分 |
| GET | `/api/knowledge` | 获取知识库文章列表 |
| GET | `/api/conversations` | 获取对话会话列表 |
| GET | `/api/export/prompts` | 导出提示词为 JSON |
| POST | `/api/import/prompts` | 从 JSON 导入提示词 |
| GET | `/api/settings` | 获取系统设置 |
| GET | `/health` | 健康检查 |

## 开源协议

MIT
