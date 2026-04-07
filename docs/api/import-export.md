# Import & Export

Data backup and restore endpoints. All require authentication.

## Export Prompts

```
GET /api/export/prompts
```

Returns a JSON file containing all prompts with their categories and tags.

## Export AI Configs

```
GET /api/export/ai-configs
```

Returns a JSON file containing all AI configurations. API keys are included in encrypted form.

## Import Prompts

```
POST /api/import/prompts
```

**Content-Type:** `application/json`

**Request Body:** The JSON content previously exported from `/api/export/prompts`.

## Import AI Configs

```
POST /api/import/ai-configs
```

**Content-Type:** `application/json`

**Request Body:** The JSON content previously exported from `/api/export/ai-configs`.

::: warning
Imported AI configs with encrypted API keys can only be decrypted if the `ENCRYPTION_KEY` matches the one used during export.
:::
