# 系统设置

键值对形式的系统设置。所有端点需要认证。

## 列表

```
GET /api/settings
```

## 获取单个

```
GET /api/settings/:key
```

## 创建或更新

```
POST /api/settings
```

请求体：`{"key": "theme", "value": "dark"}`

## 删除

```
DELETE /api/settings/:key
```
