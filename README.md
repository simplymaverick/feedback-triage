# AI-Powered Feedback Triage

A full-stack application that ingests product feedback, stores it in SQLite, and uses OpenAI to generate structured triage analysis (summary, sentiment, tags, priority, next action).

## Prerequisites

- Node.js 20+
- npm 10+

## Quick start

```bash
# Install dependencies
npm install

# Configure API — add OPENAI_API_KEY for real AI analysis
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env: OPENAI_API_KEY=your_key, AI_MOCK_MODE=false

# Run database migration
npm run db:generate
npm run db:migrate -w @feedback-triage/api

# Configure frontend
cp apps/web/.env.example apps/web/.env

# Start API + web together
npm run dev       # API http://localhost:3001, web http://localhost:5173

# Or run separately
npm run dev:api
npm run dev:web
```

## Environment variables

| Variable | App | Description |
|----------|-----|-------------|
| `PORT` | API | Server port (default `3001`) |
| `DATABASE_URL` | API | Prisma connection string |
| `AI_PROVIDER` | API | `openai` (default), `gemini`, or `anthropic` |
| `ANTHROPIC_API_KEY` | API | Anthropic key (when `AI_PROVIDER=anthropic`) |
| `ANTHROPIC_MODEL` | API | Claude model (default `claude-3-5-haiku-latest`) |
| `LOG_LEVEL` | API | pino log level (default `info`) |
| `GEMINI_API_KEY` | API | Google Gemini API key ([AI Studio](https://aistudio.google.com/apikey)) |
| `GEMINI_MODEL` | API | Gemini model (default `gemini-2.0-flash`) |
| `OPENAI_API_KEY` | API | OpenAI key (default provider; required when `AI_PROVIDER=openai`) |
| `OPENAI_MODEL` | API | OpenAI model (default `gpt-4o-mini`) |
| `AI_MOCK_MODE` | API | `true` forces fake analysis; `false` + API key uses real AI |
| `CORS_ORIGIN` | API | Allowed frontend origin |
| `VITE_API_BASE_URL` | Web | Backend base URL |

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/feedback` | Submit feedback (sync AI analysis) |
| `GET` | `/api/feedback` | Paginated list with `sentiment`, `tag`, `search` filters |
| `GET` | `/api/feedback/:id` | Single feedback record |
| `GET` | `/health` | Health check |

## Scripts

```bash
npm run install:all  # Install dependencies for all workspaces
npm run dev          # Start API + web in parallel
npm run dev:api      # Start API only
npm run dev:web      # Start web only
npm test             # Run all tests
npm run build        # Build API + web (production)
npm run build:api    # Build API only (Prisma generate + tsc → apps/api/dist)
npm run build:web    # Build web only (tsc + vite → apps/web/dist)
```

## Project structure

```
apps/api/     Fastify + Prisma + multi-provider AI
apps/web/     React + Vite + TanStack Query (OfferZen-branded UI)
```

See [SOLUTION.md](./SOLUTION.md) for architecture, trade-offs, and operational runbook.
