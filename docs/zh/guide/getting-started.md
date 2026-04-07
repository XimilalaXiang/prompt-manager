# 快速开始

## 前置条件

- 已安装 Docker 和 Docker Compose
- 至少 64MB 内存（应用非常轻量）

## 快速部署

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

## 首次设置

1. 在浏览器打开 `http://localhost:8080`
2. 自动跳转到设置页面
3. 创建管理员用户名和密码
4. 开始使用！

## 添加 AI 模型

1. 进入 **AI 配置** 页面
2. 点击 **新建配置**
3. 填写：
   - **名称**：友好名称（如 "GPT-4o"）
   - **提供商**：API 提供商（如 `openai`）
   - **模型**：模型 ID（如 `gpt-4o`）
   - **API Key**：你的 API 密钥（加密存储）
   - **Base URL**：API 端点（如 `https://api.openai.com/v1`）
4. 点击 **测试** 验证连接
5. 保存配置

## 下一步

- [配置说明](./configuration)
- [提示词管理](./prompts)
- [多模型对比](./comparison)
- [Docker 部署](./docker)
