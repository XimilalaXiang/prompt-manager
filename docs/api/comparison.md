# Comparison

Multi-model comparison endpoints. All require authentication.

## Send (Non-Streaming)

Send a prompt to multiple models and get all responses.

```
POST /api/compare/send
```

**Request Body:**

```json
{
  "prompt": "Explain quantum computing in simple terms",
  "system_prompt": "You are a helpful teacher",
  "config_ids": [1, 2, 3]
}
```

**Response:**

```json
{
  "results": [
    {
      "config_id": 1,
      "config_name": "GPT-4o",
      "model": "gpt-4o",
      "content": "Quantum computing uses...",
      "duration_ms": 2340,
      "tokens": 150
    },
    {
      "config_id": 2,
      "config_name": "Claude",
      "model": "claude-3-sonnet",
      "content": "Think of quantum computing...",
      "duration_ms": 1890,
      "tokens": 180
    }
  ]
}
```

## Stream (SSE)

Stream responses from multiple models via Server-Sent Events.

```
POST /api/compare/stream
```

**Request Body:** Same as Send.

**Response:** SSE stream with events:

```
data: {"config_id":1,"config_name":"GPT-4o","type":"delta","content":"Quantum "}

data: {"config_id":1,"config_name":"GPT-4o","type":"delta","content":"computing "}

data: {"config_id":1,"config_name":"GPT-4o","type":"done","content":"","duration_ms":2340}

data: {"config_id":2,"config_name":"Claude","type":"delta","content":"Think of "}
```

Event types:
- `delta` — Partial content chunk
- `done` — Model finished responding
- `error` — Error occurred for this model

## Auto-Rate

Have an AI model rate and compare the responses.

```
POST /api/compare/rate
```

**Request Body:**

```json
{
  "prompt": "The original prompt",
  "responses": [
    {
      "model": "GPT-4o",
      "content": "Response from GPT-4o..."
    },
    {
      "model": "Claude",
      "content": "Response from Claude..."
    }
  ],
  "rater_config_id": 1
}
```

**Response:**

```json
{
  "ratings": [
    {
      "model": "GPT-4o",
      "score": 8.5,
      "reasoning": "Clear and accurate explanation..."
    },
    {
      "model": "Claude",
      "score": 9.0,
      "reasoning": "Excellent use of analogies..."
    }
  ]
}
```
