# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Support-AI is a multi-tenant AI customer support platform: FastAPI (async) + SQLAlchemy 2.0 (AsyncSession) + PostgreSQL/pgvector backend, Celery/RabbitMQ task queue, Redis cache, and a Next.js 16 (React 19) frontend dashboard. It provides RAG-based chat, automated ticket escalation, Stripe billing, outbound webhooks, and an embeddable JS chat widget.

The full architecture (layered diagram, sequence diagrams for document ingestion/chat/webhooks/billing, ER diagram, auth model, exception table) is documented in [README.md](README.md) — read it for system-level detail beyond what's summarized here.

## Commands

Backend uses `uv` for dependency and script management; run all Python commands through `uv run`.

```bash
# Install deps
uv sync

# Run dev server (http://localhost:8000, docs at /docs)
uv run fastapi dev app/main.py

# Apply DB migrations
uv run alembic upgrade head

# Create a new migration after changing models in app/models/
uv run alembic revision --autogenerate -m "description"

# Run tests
uv run pytest tests/
# Run a single test file / test
uv run pytest tests/test_webhooks.py
uv run pytest tests/test_webhooks.py::TestSignWebhookPayload::test_format

# Lint / type-check
uv run ruff check .
uv run mypy .

# Celery worker (all queues) and beat scheduler
uv run celery -A app.workers.celery_app worker --loglevel=info -Q high_priority,emails,webhooks
uv run celery -A app.workers.celery_app beat --loglevel=info
```

Frontend (`frontend/`) is a Next.js app, not the Vite dashboard described in older docs:

```bash
cd frontend
npm install
npm run dev     # http://localhost:3000
npm run build
npm run lint
```

Docker Compose (`docker-compose.yml`) spins up api, worker, postgres (pgvector), redis, rabbitmq, prometheus, grafana, and jaeger together — use it when you need the full stack rather than running services individually.

## Architecture

**Strict layered boundary**: `app/api/v1/*` routers never touch ORM models or raw SQL directly — they call into `app/services/*`, which call `app/repositories/*` for data access. Repositories return ORM models (`app/models/*`); services translate between ORM models, internal DTOs (`app/dto/`), and Pydantic API schemas (`app/schemas/`). Do not let a router import a repository or model directly — follow the existing router → service → repository chain when adding endpoints.

**Multi-tenancy**: every domain resource (knowledge bases, conversations, tickets, webhooks, API keys) is scoped by `organization_id`, enforced both in repository queries and again in the service layer. Any new query/service method touching tenant data must filter by org.

**Two auth mechanisms**, both implemented in `app/dependencies/`:
- JWT session tokens (`Authorization: Bearer`) for the dashboard frontend — issued via email+password login (`OAuth2PasswordRequestForm`) or Google OAuth (`POST /auth/google`, ID token verified server-side), paired with a rotating refresh token tracked in `user_sessions` (`POST /auth/refresh` rotates on use). Email OTP (cached in Redis, sent via Celery to the `high_priority` queue) is used **only** for the forgot-password flow, not for registration or normal login.
- API keys (`X-API-Key`), SHA-256 hashed at rest, scoped per organization, used by the embeddable widget (`app/static/widget.js`) and external clients via `app/api/v1/widget.py`.

**Async everywhere**: all DB access uses SQLAlchemy 2.0 `AsyncSession`. Relationship loading must be declared explicitly (e.g. `selectinload`) in repository queries — async lazy-loading is not available and will raise `MissingGreenlet`. Session lifecycle: repositories `flush()`, services own the `commit()` boundary for multi-repository operations.

**Structured LLM outputs**: `app/processing/llms/` wraps OpenAI's `beta.chat.completions.parse` with Pydantic response models (see `OpenAIProvider.complete_structured`) instead of hand-parsing text, used for the escalation decision (`ANSWER` vs `ESCALATE`) and other structured generations. New LLM-driven features should follow this pattern — define a Pydantic response model, don't free-text parse.

**RAG pipeline**: document upload → `DocumentService` inserts a `PENDING` row → background task in `app/processing/document/` parses + chunks the file → embeddings generated via OpenAI (`text-embedding-3-small`) → chunks stored with pgvector embeddings → status flips to `READY`. Chat retrieval (`RetrievalService`) does cosine similarity search over `document_chunks` via pgvector, then `EscalationService` decides whether to answer directly or escalate to a ticket.

**Async task queue** (`app/workers/celery_app.py` for queue routing/Beat schedule, `app/workers/tasks.py` for task bodies): three queues — `high_priority` (OTP emails), `emails` (ticket-created emails), `webhooks` (outbound dispatch) — plus an hourly Beat job that purges expired sessions. When adding a new async side-effect, add a task here and route it to the appropriate queue rather than doing the work inline in a service/router.

**Outbound webhooks**: `WebhookService` looks up subscribed endpoints for an event, enqueues one Celery task per endpoint, and `WebhookDispatcher` sends an HMAC-SHA256-signed POST, recording every attempt in `webhook_deliveries` and tracking `consecutive_failures` on the endpoint.

**Domain exceptions**: custom exceptions live in `app/exceptions/` and are mapped to HTTP status codes centrally in `app/core/exception_handlers.py` (registered once in `app/main.py`). Raise a domain exception from services rather than an `HTTPException` so routers stay free of status-code logic.

**Observability**: Sentry (errors), Prometheus (`/metrics` via `prometheus-fastapi-instrumentator`), and OpenTelemetry/Jaeger (tracing) are all wired up in `app/main.py`; `app/core/logging.py` + `app/middleware/logging_middleware.py` handle structured request logging, and `CorrelationIdMiddleware` attaches a correlation ID that flows through logs/traces for a request. Middleware order in `main.py` matters — the last-added middleware runs first on the way in.

**Usage/plan enforcement**: `UsageService` checks metered usage (AI responses, AI tokens, documents, knowledge bases, members, storage) against plan tier (`PlanTier.FREE`/`PRO`/`ENTERPRISE`, configured in `app/core/plan_config.py`) before allowing AI-driven operations to proceed; `SubscriptionService` handles Stripe checkout sessions and processes Stripe webhook events to keep `organization_subscriptions` in sync.

## Notes

- `frontend/AGENTS.md` is auto-generated/re-added by `next dev` on every run (see the file for its own explanation) — don't fight it if it reappears after being edited out of a diff; commit it as-is if it shows up alongside real changes.
- `README.md`'s directory-structure section describes the frontend as a Vite-based React app; the actual `frontend/` is Next.js 16 — trust the actual `frontend/package.json`/`next.config.ts` over that part of the README.
