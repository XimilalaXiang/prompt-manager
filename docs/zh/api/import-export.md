# 导入导出

数据备份和恢复端点。所有端点需要认证。

## 导出提示词

```
GET /api/export/prompts
```

返回包含所有提示词及其分类和标签的 JSON 文件。

## 导出 AI 配置

```
GET /api/export/ai-configs
```

返回所有 AI 配置的 JSON 文件。API 密钥以加密形式包含。

## 导入提示词

```
POST /api/import/prompts
```

从之前导出的 JSON 导入提示词。

## 导入 AI 配置

```
POST /api/import/ai-configs
```

从之前导出的 JSON 导入 AI 配置。

::: warning
导入的 AI 配置中加密的 API 密钥只有在 `ENCRYPTION_KEY` 与导出时一致的情况下才能解密。
:::
