# API Reference

## Base URL

All API endpoints are prefixed with `/api`.

```
http://localhost:8080/api
```

## Authentication

Most endpoints require a JWT bearer token. Include it in the `Authorization` header:

```
Authorization: Bearer <your-access-token>
```

Public endpoints (no auth required):
- `GET /api/auth/status`
- `POST /api/auth/setup`
- `POST /api/auth/login`
- `POST /api/auth/refresh`

## Response Format

All responses are JSON. Successful responses return the data directly. Error responses follow this format:

```json
{
  "error": "error message"
}
```

## Pagination

List endpoints support pagination via query parameters:

| Parameter | Default | Description |
|---|---|---|
| `page` | `1` | Page number |
| `page_size` | `20` | Items per page |

## Health Check

```
GET /health
```

Returns `{"status": "ok"}` when the server is running.

## Sections

- [Authentication](./auth) — Login, setup, token refresh
- [Prompts](./prompts) — CRUD, search, version history
- [Categories](./categories) — Prompt categories
- [AI Configs](./ai-configs) — AI provider configurations
- [Comparison](./comparison) — Multi-model comparison
- [Knowledge](./knowledge) — Knowledge base articles
- [Conversations](./conversations) — Conversation sessions
- [Settings](./settings) — System settings
- [Import & Export](./import-export) — Data import/export
