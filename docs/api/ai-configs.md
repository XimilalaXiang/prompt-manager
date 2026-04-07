# AI Configs

Manage AI provider configurations. API keys are encrypted with AES-256-GCM before storage.

All endpoints require authentication.

## List Configs

```
GET /api/ai-configs
```

**Response:**

```json
[
  {
    "id": 1,
    "name": "GPT-4o",
    "provider": "openai",
    "model": "gpt-4o",
    "base_url": "https://api.openai.com/v1",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

::: info
API keys are never returned in list or get responses for security.
:::

## Get Config

```
GET /api/ai-configs/:id
```

## Create Config

```
POST /api/ai-configs
```

**Request Body:**

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

## Update Config

```
PUT /api/ai-configs/:id
```

## Delete Config

```
DELETE /api/ai-configs/:id
```

## Test Connection

Send a test request to verify the AI configuration works.

```
POST /api/ai-configs/:id/test
```

**Response:**

```json
{
  "success": true,
  "message": "Connection successful",
  "response": "Hello! How can I help you today?"
}
```
