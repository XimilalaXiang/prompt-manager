# What is Prompt Manager?

Prompt Manager is a self-hosted web application for managing AI prompts. It's designed for AI power users who want to:

- Organize and version-control their prompts
- Compare responses from multiple AI models side-by-side
- Store API configurations securely with encryption
- Keep a knowledge base alongside their prompts
- Self-host everything with zero external dependencies

## Architecture

The application consists of:

- **Backend**: Go (Gin framework) with SQLite database
- **Frontend**: React 18 with TypeScript and Tailwind CSS (Neo-Brutalist design)
- **Deployment**: Single Docker image (~20MB) serving both API and frontend

All data is stored in a single SQLite file with WAL mode enabled for concurrent access.

## Key Features

| Feature | Description |
|---|---|
| Prompt CRUD | Full lifecycle management with search and favorites |
| Version History | Automatic versioning with rollback support |
| Multi-Model Compare | Send prompts to multiple models simultaneously |
| SSE Streaming | Real-time response streaming |
| AI Auto-Rating | Automated model response scoring |
| Knowledge Base | Reference articles and notes |
| Conversation Sessions | Save and revisit AI conversations |
| Import/Export | JSON-based backup and restore |
| Security | AES-256-GCM + JWT + bcrypt |
