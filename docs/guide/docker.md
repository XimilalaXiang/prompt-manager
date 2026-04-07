# Docker Deployment

## Docker Compose

The recommended way to deploy Prompt Manager:

```yaml
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
```

## Docker Run

```bash
docker run -d \
  --name prompt-manager \
  -p 8080:8080 \
  -v ./data:/app/data \
  -e JWT_SECRET=change-this-to-a-random-secret \
  -e ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef \
  ghcr.io/ximilalaxiang/prompt-manager:latest
```

## Image Details

- **Registry**: `ghcr.io/ximilalaxiang/prompt-manager`
- **Architectures**: `linux/amd64`, `linux/arm64`
- **Base image**: Alpine Linux 3.20
- **Image size**: ~20MB
- **Tags**:
  - `latest` — latest build from main branch
  - `v1.0.0` — specific version tags
  - `sha-abc1234` — commit-specific builds

## Updating

```bash
docker compose pull
docker compose up -d
```

## Data Persistence

The SQLite database is stored at `/app/data/prompt-manager.db` inside the container. Mount a host directory to `/app/data` to persist data across container restarts.

```yaml
volumes:
  - ./data:/app/data
```

## Reverse Proxy

### Nginx

```nginx
server {
    listen 80;
    server_name prompt.example.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE support
        proxy_buffering off;
        proxy_cache off;
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        chunked_transfer_encoding off;
    }
}
```

::: warning
If you use a reverse proxy, make sure to disable buffering for SSE (streaming) to work correctly.
:::

## Health Check

```bash
curl http://localhost:8080/health
# {"status":"ok"}
```
