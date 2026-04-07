# Authentication

## Check Status

Check if an admin account has been configured.

```
GET /api/auth/status
```

**Response:**

```json
{
  "configured": false
}
```

## Setup

Create the initial admin account. Only works if no admin exists yet.

```
POST /api/auth/setup
```

**Request Body:**

```json
{
  "username": "admin",
  "password": "your-password"
}
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "admin"
  }
}
```

## Login

```
POST /api/auth/login
```

**Request Body:**

```json
{
  "username": "admin",
  "password": "your-password"
}
```

**Response:** Same format as Setup.

## Refresh Token

Exchange a refresh token for a new access token.

```
POST /api/auth/refresh
```

**Request Body:**

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```
