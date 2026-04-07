# 认证

## 检查状态

检查是否已配置管理员账户。

```
GET /api/auth/status
```

**响应：** `{"configured": false}`

## 初始设置

创建管理员账户（仅在首次使用时有效）。

```
POST /api/auth/setup
```

**请求体：** `{"username": "admin", "password": "your-password"}`

**响应：** 返回 `access_token`、`refresh_token` 和用户信息。

## 登录

```
POST /api/auth/login
```

**请求体：** `{"username": "admin", "password": "your-password"}`

## 刷新 Token

用 Refresh Token 换取新的 Access Token。

```
POST /api/auth/refresh
```

**请求体：** `{"refresh_token": "eyJhbGciOiJIUzI1NiIs..."}`

**响应：** 返回新的 `access_token` 和 `refresh_token`。
