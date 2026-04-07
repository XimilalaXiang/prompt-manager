# Prompts

All endpoints require authentication.

## List Prompts

```
GET /api/prompts
```

**Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `page` | int | Page number (default: 1) |
| `page_size` | int | Items per page (default: 20) |
| `search` | string | Search in title and content |
| `category_id` | int | Filter by category |
| `favorite` | bool | Filter favorites only |

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "title": "Code Review Prompt",
      "content": "Review the following code...",
      "category_id": 1,
      "category": { "id": 1, "name": "Development" },
      "is_favorite": true,
      "tags": "code,review",
      "version": 3,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-02T00:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "page_size": 20
}
```

## Get Prompt

```
GET /api/prompts/:id
```

## Create Prompt

```
POST /api/prompts
```

**Request Body:**

```json
{
  "title": "My Prompt",
  "content": "Prompt content here...",
  "category_id": 1,
  "tags": "tag1,tag2"
}
```

## Update Prompt

```
PUT /api/prompts/:id
```

**Request Body:** Same as Create. A new version is created automatically.

## Delete Prompt

```
DELETE /api/prompts/:id
```

## Toggle Favorite

```
POST /api/prompts/:id/favorite
```

## Version History

```
GET /api/prompts/:id/versions
```

**Response:**

```json
[
  {
    "id": 3,
    "prompt_id": 1,
    "title": "Updated Title",
    "content": "Updated content...",
    "version": 3,
    "created_at": "2024-01-03T00:00:00Z"
  },
  {
    "id": 2,
    "prompt_id": 1,
    "title": "Original Title",
    "content": "Original content...",
    "version": 2,
    "created_at": "2024-01-02T00:00:00Z"
  }
]
```

## Rollback

Restore a prompt to a specific version.

```
POST /api/prompts/:id/rollback/:version
```
