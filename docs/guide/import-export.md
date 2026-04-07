# Import & Export

Prompt Manager supports JSON-based import and export for backup and migration.

## Export

### Prompts

```
GET /api/export/prompts
```

Exports all prompts with their categories and tags as a JSON file.

### AI Configs

```
GET /api/export/ai-configs
```

Exports all AI configurations. API keys are exported in encrypted form for security.

## Import

### Prompts

```
POST /api/import/prompts
```

Import prompts from a previously exported JSON file. Duplicate detection prevents accidental re-imports.

### AI Configs

```
POST /api/import/ai-configs
```

Import AI configurations from a previously exported JSON file.

## Backup Strategy

For a complete backup, you have two options:

1. **Database file**: Simply copy the SQLite database file from `./data/prompt-manager.db`
2. **JSON export**: Use the export endpoints for a portable, human-readable backup

::: tip
The SQLite database file is the most complete backup option, as it includes all data including conversation history and settings.
:::
