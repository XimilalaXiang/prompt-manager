# 提示词

所有端点需要认证。

## 列表

```
GET /api/prompts
```

查询参数：`page`、`page_size`、`search`、`category_id`、`favorite`

## 获取单个

```
GET /api/prompts/:id
```

## 创建

```
POST /api/prompts
```

请求体：`{"title": "标题", "content": "内容", "category_id": 1, "tags": "tag1,tag2"}`

## 更新

```
PUT /api/prompts/:id
```

更新时自动创建新版本。

## 删除

```
DELETE /api/prompts/:id
```

## 切换收藏

```
POST /api/prompts/:id/favorite
```

## 版本历史

```
GET /api/prompts/:id/versions
```

返回该提示词的所有历史版本。

## 回滚

```
POST /api/prompts/:id/rollback/:version
```

将提示词恢复到指定版本。
