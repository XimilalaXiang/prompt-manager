# Getting Started

## Prerequisites

- Docker and Docker Compose installed
- A machine with at least 64MB RAM (the app is very lightweight)

## Quick Deploy

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

## First-Time Setup

1. Open `http://localhost:8080` in your browser
2. You'll be redirected to the setup page
3. Create your admin username and password
4. You're ready to use Prompt Manager!

## Adding AI Models

1. Go to the **AI Config** page
2. Click **New Config**
3. Enter:
   - **Name**: A friendly name (e.g., "GPT-4o")
   - **Provider**: The API provider (e.g., `openai`)
   - **Model**: The model ID (e.g., `gpt-4o`)
   - **API Key**: Your API key (stored encrypted)
   - **Base URL**: The API endpoint (e.g., `https://api.openai.com/v1`)
4. Click **Test** to verify the connection
5. Save the configuration

## Next Steps

- [Configure environment variables](./configuration)
- [Manage prompts](./prompts)
- [Compare AI models](./comparison)
- [Deploy with Docker](./docker)
