# AI Playground Frontend

React + Vite + TypeScript + Tailwind UI for the AI Playground.

This repository is independent from `../ai-playground-backend`. Docker Compose lives in the backend repo and mounts this frontend via `../ai-playground-frontend`.

## Scripts

- `npm run dev` — Vite development server
- `npm run build` — type-check and production build
- `npm run preview` — preview the production build
- `npm run typecheck` — TypeScript project references check

## Environment

Copy `.env.example` to `.env` for local non-Docker runs.

`VITE_API_BASE_URL` must be a browser-reachable URL (for example
`http://localhost:3000/api`). Do not use Docker-internal hostnames here.
Never put AI API keys in frontend env files.

## Module architecture

```text
src/
  app/                 # App shell + router
  pages/               # Dashboard, placeholders, 404
  components/          # Shared UI / status
  features/
    chat-assistant/    # page, api, types
    task-assistant/    # page, components, api, types
    semantic-search/   # page, api, types (full Project 3 UI)
    pdf-rag/           # metadata placeholder
    document-summarizer/
    research-agent/
  services/api/        # shared HTTP client (no feature business logic)
  styles/
```

### Feature module rules

Each feature owns its page, API helpers, types, and optional components/hooks.
Dashboard cards come from `features/registry.ts`, which imports metadata exported by each feature (`index.ts`). Routes for implemented features are registered in `app/router.tsx`.

### How to add a frontend feature

1. Create `src/features/<name>/` with `pages/`, `api/`, `types/`, and `index.ts`
2. Export feature metadata (`id`, `title`, `description`, `tech`, `path`) from `index.ts`
3. Add the metadata to `features/registry.ts`
4. Register a concrete route in `app/router.tsx` (or keep the placeholder via `/features/:featureId`)
5. Call the backend through `services/api/client.ts` request helpers — never call AI providers from the browser

## Features

### AI Chat Assistant

Route: `/features/chat-assistant`

Conversational chat with persisted conversations/messages via `/api/chat`.

### AI Task Assistant

Route: `/features/task-assistant`

Natural-language task management using OpenAI tool calling:

- Suggested prompts for create/list/update flows
- Manual task CRUD form alongside chat
- Live task side panel fed by `/api/tasks`
- Action summaries from tool results
- Explicit delete confirmation dialog using `/api/tasks/:id/confirm-delete`

Task IDs shown in the UI are the real BIGINT identity values returned by the backend (serialized as decimal strings).

### Semantic Document Search

Route: `/features/semantic-search`

Full Project 3 UI:

- Drag-and-drop / browse upload for PDF, TXT, Markdown (10 MB default)
- Indexed document list with status, chunk counts, sizes, and delete confirmation
- Natural-language search with result limit and optional document filters
- Ranked result cards showing passage, similarity %, and document/chunk IDs

Similarity percentages are cosine similarities from the embedding model — not calibrated probabilities of correctness.

### Placeholders

`pdf-qa`, `summarizer`, and `research-agent` remain dashboard cards with placeholder pages until implemented.
