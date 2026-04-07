# 知识库

所有端点需要认证。

## 列表

```
GET /api/knowledge
```

查询参数：`page`、`page_size`、`search`、`favorite`、`archived`

## 获取单个

```
GET /api/knowledge/:id
```

## 创建

```
POST /api/knowledge
```

请求体：`{"title": "标题", "content": "内容", "category": "分类", "tags": "标签"}`

## 更新

```
PUT /api/knowledge/:id
```

## 删除

```
DELETE /api/knowledge/:id
```

## 切换收藏

```
POST /api/knowledge/:id/favorite
```

## 切换归档

```
POST /api/knowledge/:id/archive
```
