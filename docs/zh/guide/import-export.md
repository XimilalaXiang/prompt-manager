# 导入导出

Prompt Manager 支持基于 JSON 的导入导出，用于备份和迁移。

## 导出

### 提示词

```
GET /api/export/prompts
```

将所有提示词及其分类和标签导出为 JSON 文件。

### AI 配置

```
GET /api/export/ai-configs
```

导出所有 AI 配置。API 密钥以加密形式导出。

## 导入

### 提示词

```
POST /api/import/prompts
```

从之前导出的 JSON 文件导入提示词。重复检测防止意外重复导入。

### AI 配置

```
POST /api/import/ai-configs
```

从之前导出的 JSON 文件导入 AI 配置。

## 备份策略

完整备份有两种方式：

1. **数据库文件**：直接复制 SQLite 数据库文件 `./data/prompt-manager.db`
2. **JSON 导出**：使用导出端点获得可移植、可读的备份

::: tip
SQLite 数据库文件是最完整的备份方式，包含所有数据（对话历史、设置等）。
:::
