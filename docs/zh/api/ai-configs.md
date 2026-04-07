# AI 配置

管理 AI 提供商配置。API 密钥在存储前使用 AES-256-GCM 加密。

所有端点需要认证。

## 列表

```
GET /api/ai-configs
```

API 密钥不会在列表或获取响应中返回。

## 获取单个

```
GET /api/ai-configs/:id
```

## 创建

```
POST /api/ai-configs
```

请求体：

```json
{
  "name": "GPT-4o",
  "provider": "openai",
  "model": "gpt-4o",
  "api_key": "sk-...",
  "base_url": "https://api.openai.com/v1",
  "is_active": true
}
```

## 更新

```
PUT /api/ai-configs/:id
```

## 删除

```
DELETE /api/ai-configs/:id
```

## 测试连接

```
POST /api/ai-configs/:id/test
```

发送测试请求验证 AI 配置是否正常工作。
