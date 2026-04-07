# Settings

Key-value system settings. All endpoints require authentication.

## List Settings

```
GET /api/settings
```

**Response:**

```json
[
  {
    "key": "theme",
    "value": "dark"
  },
  {
    "key": "language",
    "value": "en"
  }
]
```

## Get Setting

```
GET /api/settings/:key
```

## Upsert Setting

Create or update a setting.

```
POST /api/settings
```

**Request Body:**

```json
{
  "key": "theme",
  "value": "dark"
}
```

## Delete Setting

```
DELETE /api/settings/:key
```
