# Conversations

Manage conversation sessions and saved comparisons. All endpoints require authentication.

## List Sessions

```
GET /api/conversations
```

## Get Session

```
GET /api/conversations/:id
```

## Create Session

```
POST /api/conversations
```

**Request Body:**

```json
{
  "title": "Code Review Discussion",
  "description": "Comparing models for code review tasks"
}
```

## Update Session

```
PUT /api/conversations/:id
```

## Delete Session

```
DELETE /api/conversations/:id
```

## Save Messages

Add messages to a conversation session.

```
POST /api/conversations/:id/messages
```

**Request Body:**

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Review this code..."
    },
    {
      "role": "assistant",
      "content": "Here are my suggestions...",
      "model": "GPT-4o"
    }
  ]
}
```

## Save Comparison

Save a multi-model comparison result to a session.

```
POST /api/conversations/:id/comparisons
```

## List Comparisons

List all saved comparisons across sessions.

```
GET /api/comparisons
```
