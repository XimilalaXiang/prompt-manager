# 本地开发

## 前置条件

- Go 1.25+
- Node.js 20+
- npm

## 后端

```bash
git clone https://github.com/XimilalaXiang/prompt-manager.git
cd prompt-manager

cp .env.example .env

go run ./cmd/server
```

后端启动在 `http://localhost:8080`。

## 前端

```bash
cd web
npm install
npm run dev
```

Vite 开发服务器启动在 `http://localhost:5173`，`/api` 请求会代理到 `http://localhost:8080`。

## 项目结构

```
prompt-manager/
├── cmd/server/          # 应用入口
├── internal/
│   ├── config/          # 配置加载
│   ├── database/        # SQLite 初始化
│   ├── handler/         # HTTP 请求处理器
│   ├── middleware/       # JWT 认证、CORS、日志
│   ├── model/           # GORM 数据模型
│   ├── router/          # 路由定义
│   └── service/         # 业务逻辑（加密、AI 代理）
├── web/                 # React 前端
├── docs/                # VitePress 文档
├── Dockerfile           # 多阶段构建
├── docker-compose.yml   # 生产部署
└── .github/workflows/   # CI/CD 流水线
```

## 构建

### 仅构建后端

```bash
CGO_ENABLED=1 go build -o server ./cmd/server
```

### 仅构建前端

```bash
cd web && npm run build
```

### 本地构建 Docker 镜像

```bash
docker build -t prompt-manager .
```
