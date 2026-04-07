# 对话

管理对话会话和保存的对比结果。所有端点需要认证。

## 列表

```
GET /api/conversations
```

## 获取单个

```
GET /api/conversations/:id
```

## 创建

```
POST /api/conversations
```

请求体：`{"title": "标题", "description": "描述"}`

## 更新

```
PUT /api/conversations/:id
```

## 删除

```
DELETE /api/conversations/:id
```

## 保存消息

```
POST /api/conversations/:id/messages
```

## 保存对比结果

```
POST /api/conversations/:id/comparisons
```

## 列出所有对比

```
GET /api/comparisons
```
