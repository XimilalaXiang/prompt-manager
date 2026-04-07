# Docker 部署

## Docker Compose

推荐的部署方式：

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
      - JWT_SECRET=请替换为随机密钥
      - ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

## Docker Run

```bash
docker run -d \
  --name prompt-manager \
  -p 8080:8080 \
  -v ./data:/app/data \
  -e JWT_SECRET=请替换为随机密钥 \
  -e ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef \
  ghcr.io/ximilalaxiang/prompt-manager:latest
```

## 镜像信息

- **仓库**：`ghcr.io/ximilalaxiang/prompt-manager`
- **架构**：`linux/amd64`、`linux/arm64`
- **基础镜像**：Alpine Linux 3.20
- **镜像大小**：约 20MB
- **标签**：
  - `latest` — main 分支最新构建
  - `v1.0.0` — 版本标签
  - `sha-abc1234` — commit 级别构建

## 更新

```bash
docker compose pull
docker compose up -d
```

## 数据持久化

SQLite 数据库存储在容器内 `/app/data/prompt-manager.db`。挂载主机目录到 `/app/data` 以在容器重启后保留数据。

## 反向代理

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

        # SSE 支持
        proxy_buffering off;
        proxy_cache off;
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        chunked_transfer_encoding off;
    }
}
```

::: warning
如果使用反向代理，确保关闭缓冲以支持 SSE（流式传输）。
:::

## 健康检查

```bash
curl http://localhost:8080/health
# {"status":"ok"}
```
