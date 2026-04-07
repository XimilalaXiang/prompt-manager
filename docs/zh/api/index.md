# API 参考

## 基础 URL

所有 API 端点以 `/api` 为前缀。

```
http://localhost:8080/api
```

## 认证

大多数端点需要 JWT Bearer Token。在 `Authorization` 头中包含：

```
Authorization: Bearer <your-access-token>
```

公开端点（无需认证）：
- `GET /api/auth/status`
- `POST /api/auth/setup`
- `POST /api/auth/login`
- `POST /api/auth/refresh`

## 响应格式

所有响应为 JSON。成功响应直接返回数据。错误响应格式：

```json
{
  "error": "错误信息"
}
```

## 分页

列表端点支持分页查询参数：

| 参数 | 默认值 | 说明 |
|---|---|---|
| `page` | `1` | 页码 |
| `page_size` | `20` | 每页条数 |

## 健康检查

```
GET /health
```

服务运行时返回 `{"status": "ok"}`。

## 章节

- [认证](./auth) — 登录、设置、Token 刷新
- [提示词](./prompts) — CRUD、搜索、版本历史
- [分类](./categories) — 提示词分类
- [AI 配置](./ai-configs) — AI 提供商配置
- [模型对比](./comparison) — 多模型对比
- [知识库](./knowledge) — 知识库文章
- [对话](./conversations) — 对话会话
- [系统设置](./settings) — 系统设置
- [导入导出](./import-export) — 数据导入导出
