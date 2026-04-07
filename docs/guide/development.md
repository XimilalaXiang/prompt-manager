# Local Development

## Prerequisites

- Go 1.25+
- Node.js 20+
- npm

## Backend

```bash
# Clone the repository
git clone https://github.com/XimilalaXiang/prompt-manager.git
cd prompt-manager

# Copy environment config
cp .env.example .env

# Run the Go server
go run ./cmd/server
```

The backend starts on `http://localhost:8080`.

## Frontend

```bash
cd web
npm install
npm run dev
```

The Vite dev server starts on `http://localhost:5173` and proxies `/api` requests to `http://localhost:8080`.

## Project Structure

```
prompt-manager/
├── cmd/server/          # Application entrypoint
├── internal/
│   ├── config/          # Configuration loading
│   ├── database/        # SQLite initialization
│   ├── handler/         # HTTP request handlers
│   ├── middleware/       # JWT auth, CORS, logging
│   ├── model/           # GORM data models
│   ├── router/          # Route definitions
│   └── service/         # Business logic (crypto, AI proxy)
├── web/                 # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── contexts/    # React contexts (auth)
│   │   └── lib/         # API client, utilities
│   └── ...
├── docs/                # VitePress documentation
├── Dockerfile           # Multi-stage build
├── docker-compose.yml   # Production deployment
└── .github/workflows/   # CI/CD pipelines
```

## Building

### Build backend only

```bash
CGO_ENABLED=1 go build -o server ./cmd/server
```

### Build frontend only

```bash
cd web && npm run build
```

### Build Docker image locally

```bash
docker build -t prompt-manager .
```
