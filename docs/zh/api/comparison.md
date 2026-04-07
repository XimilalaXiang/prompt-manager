# 模型对比

多模型对比端点。所有端点需要认证。

## 发送（非流式）

```
POST /api/compare/send
```

请求体：

```json
{
  "prompt": "用简单的话解释量子计算",
  "system_prompt": "你是一个有帮助的老师",
  "config_ids": [1, 2, 3]
}
```

## 流式发送（SSE）

```
POST /api/compare/stream
```

请求体与非流式相同。通过 Server-Sent Events 流式返回每个模型的响应。

事件类型：
- `delta` — 部分内容块
- `done` — 模型响应完成
- `error` — 该模型发生错误

## AI 自动评分

```
POST /api/compare/rate
```

请求体：

```json
{
  "prompt": "原始提示词",
  "responses": [
    {"model": "GPT-4o", "content": "GPT-4o 的响应..."},
    {"model": "Claude", "content": "Claude 的响应..."}
  ],
  "rater_config_id": 1
}
```

返回每个模型的评分和评分理由。
