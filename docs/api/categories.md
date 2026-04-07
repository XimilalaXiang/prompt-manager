# Categories

All endpoints require authentication.

## List Categories

```
GET /api/categories
```

**Response:**

```json
[
  {
    "id": 1,
    "name": "Development",
    "color": "#3B82F6",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

## Get Category

```
GET /api/categories/:id
```

## Create Category

```
POST /api/categories
```

**Request Body:**

```json
{
  "name": "Development",
  "color": "#3B82F6"
}
```

## Update Category

```
PUT /api/categories/:id
```

## Delete Category

```
DELETE /api/categories/:id
```

::: info
Deleting a category does not delete prompts in that category. They become uncategorized.
:::
