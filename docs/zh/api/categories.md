# 分类

所有端点需要认证。

## 列表

```
GET /api/categories
```

## 获取单个

```
GET /api/categories/:id
```

## 创建

```
POST /api/categories
```

请求体：`{"name": "开发", "color": "#3B82F6"}`

## 更新

```
PUT /api/categories/:id
```

## 删除

```
DELETE /api/categories/:id
```

::: info
删除分类不会删除该分类下的提示词，它们会变为未分类状态。
:::
