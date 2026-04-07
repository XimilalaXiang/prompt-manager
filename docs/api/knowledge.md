# Knowledge Base

All endpoints require authentication.

## List Articles

```
GET /api/knowledge
```

**Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `page` | int | Page number |
| `page_size` | int | Items per page |
| `search` | string | Search in title and content |
| `favorite` | bool | Filter favorites |
| `archived` | bool | Include archived articles |

## Get Article

```
GET /api/knowledge/:id
```

## Create Article

```
POST /api/knowledge
```

**Request Body:**

```json
{
  "title": "Prompt Engineering Tips",
  "content": "Article content in markdown...",
  "category": "Best Practices",
  "tags": "tips,prompt-engineering"
}
```

## Update Article

```
PUT /api/knowledge/:id
```

## Delete Article

```
DELETE /api/knowledge/:id
```

## Toggle Favorite

```
POST /api/knowledge/:id/favorite
```

## Toggle Archive

```
POST /api/knowledge/:id/archive
```
