# Support-AI: Enterprise Agentic Customer Support & RAG Platform

Support-AI is a production-grade, asynchronous, multi-tenant AI customer support platform built with **Python 3.12**, **FastAPI**, **SQLAlchemy 2.0** (AsyncSession), and **PostgreSQL** (pgvector). It integrates Retrieval-Augmented Generation (RAG), automated ticket escalation, Stripe billing, outbound webhooks, a real-time embeddable chat widget, and a React/TypeScript frontend dashboard — all backed by a Celery/RabbitMQ async task queue and Redis caching layer.

---

## 1. System Architecture & Design Principles

The application adheres to a strict **Layered Architecture** with clear separation of concerns across presentation, business logic, persistence, and external integration layers.

```mermaid
graph TD
    Widget[Embeddable JS Widget] --> WidgetAPI[Widget Router - Public]
    Client[React Frontend Dashboard] --> Router[FastAPI API Layer v1]
    Router --> Auth[Auth Middleware - JWT / API Key]
    Auth --> Service[Service Layer - Business Logic]

    subgraph Core Services
        Service --> ChatSvc[ChatService]
        Service --> EscSvc[EscalationService]
        Service --> RetSvc[RetrievalService]
        Service --> DocSvc[DocumentService]
        Service --> TktSvc[TicketService]
        Service --> WebhookSvc[WebhookService]
        Service --> SubSvc[SubscriptionService]
        Service --> UsageSvc[UsageService]
        Service --> AuthSvc[AuthService]
        Service --> OrgSvc[OrganizationService]
    end

    subgraph Data Transfer Layer
        ChatSvc <--> DTO[Internal DTOs - EscalationResult, ChatResult, Citation]
        EscSvc <--> DTO
    end

    Service --> Repo[Repository Layer - Data Access]
    Repo --> ORM[SQLAlchemy 2.0 ORM Models]
    ORM --> DB[(PostgreSQL + pgvector)]

    subgraph Async Task Queue
        Service --> Celery[Celery Workers - RabbitMQ Broker]
        Celery --> EmailQ[emails queue - Ticket & OTP emails]
        Celery --> WebhookQ[webhooks queue - Outbound dispatch]
        Celery --> HighQ[high_priority queue - OTP emails]
        Celery --> Beat[Celery Beat - Scheduled jobs]
    end

    subgraph Caching
        Service --> Redis[Redis - Rate limiting & session cache]
    end

    subgraph External Integrations
        ChatSvc --> LLMFac[LLMFactory / OpenAIProvider]
        EscSvc --> LLMFac
        LLMFac --> OpenAI[OpenAI API - gpt-4.1-mini & text-embedding-3-small]
        SubSvc --> Stripe[Stripe API - Billing & Webhooks]
        WebhookSvc --> OutboundHTTP[Outbound HTTP - Customer Endpoints]
    end
```

### Architectural Highlights
- **Strict Layered Boundary**: API routes (`app/api/v1`) never interact directly with ORM models or raw SQL. Controllers only call service methods and map internal DTOs to Pydantic API response schemas.
- **DTO vs. API Schema Decoupling**: Internal structs (`EscalationResult`, `ChatResult`, `Citation`, `EscalationDecision`) are kept distinct from presentation schemas. Changes to the API format do not force refactoring of core business logic.
- **Explicit Transaction Management**: All database mutations explicitly manage the session lifecycle (`flush()`, `commit()`). Repositories flush to the active transaction buffer while services govern atomic commits across multi-repository operations.
- **Asynchronous Eager Loading**: Avoids async lazy-loading `MissingGreenlet` errors by explicitly declaring relationship loading strategies (`selectinload`) inside all repository queries.
- **Multi-tenant Isolation**: Every resource (knowledge bases, conversations, tickets, webhooks, API keys) is scoped to an `organization_id`, enforced at both the query and service layer.
- **Usage & Tier Enforcement**: All AI-driven operations (chat messages, documents uploaded, knowledge bases created) are metered against plan quotas (`PlanTier.FREE`, `STARTER`, `PRO`) enforced by `UsageService` before processing.

---

## 2. Core Functional Pipelines

### A. Document Ingestion & Vector Processing
When a user uploads a reference document to a knowledge base, the file is processed asynchronously to avoid blocking the API thread.

```mermaid
sequenceDiagram
    participant Client
    participant Router as DocumentRouter
    participant Service as DocumentService
    participant Repo as DocumentRepository
    participant Processor as DocumentProcessor
    participant DB as PostgreSQL (pgvector)

    Client->>Router: POST /api/v1/documents (File Upload)
    Router->>Service: upload_document(knowledge_base_id, file)
    Service->>Repo: create(document_row)
    Repo->>DB: INSERT INTO documents (status: PENDING)
    Service->>Processor: BackgroundTask(process_document, document_id)
    Router-->>Client: 202 Accepted (Document Row)

    Note over Processor,DB: Asynchronous Background Execution
    Processor->>Repo: get_by_id(document_id)
    Processor->>Processor: ParserFactory.parse(file_path)
    Processor->>Processor: TextChunker.chunk(text, chunk_size, overlap)
    Processor->>OpenAI: Generate Embeddings (text-embedding-3-small)
    Processor->>DB: Batch INSERT INTO document_chunks (embedding vector)
    Processor->>DB: UPDATE documents SET status = READY
```

### B. Conversational RAG & Automated Escalation Flow
Every customer query undergoes automated intent analysis via structured LLM generation. If the AI detects requests beyond its autonomous scope (refunds, account deletions, legal inquiries), it triggers instant ticket escalation.

```mermaid
sequenceDiagram
    participant User
    participant ChatAPI as ChatController
    participant ChatSvc as ChatService
    participant RetSvc as RetrievalService
    participant EscSvc as EscalationService
    participant LLM as OpenAIProvider
    participant TktSvc as TicketService
    participant WebhookSvc as WebhookService
    participant DB as PostgreSQL

    User->>ChatAPI: POST /api/v1/chat
    ChatAPI->>ChatSvc: answer(conversation_id, question)
    ChatSvc->>DB: INSERT Message (role: USER)
    ChatSvc->>RetSvc: retrieve(knowledge_base_id, question)
    RetSvc->>DB: Cosine Similarity Search via pgvector (top-K chunks)
    ChatSvc->>EscSvc: process(conversation, history, chunks, question)
    EscSvc->>LLM: complete_structured(EscalationDecision)
    LLM-->>EscSvc: EscalationDecision(action, answer, reason)

    alt Action == ANSWER
        EscSvc-->>ChatSvc: EscalationResult(answer, escalated: False)
    else Action == ESCALATE
        EscSvc->>TktSvc: create_ticket(conversation_id)
        TktSvc->>DB: INSERT INTO tickets (status: OPEN)
        TktSvc->>WebhookSvc: dispatch(ticket.created event)
        EscSvc-->>ChatSvc: EscalationResult(handoff_prompt, escalated: True)
    end

    ChatSvc->>DB: INSERT Message (role: ASSISTANT)
    ChatSvc->>LLM: _generate_title(question, answer)
    ChatSvc->>DB: UPDATE conversations SET title
    ChatAPI-->>User: ChatResponse(answer, citations, message_id)
```

### C. Outbound Webhook Dispatch Pipeline
Platform events (e.g., `ticket.created`, `ticket.resolved`) are dispatched asynchronously to customer-configured HTTP endpoints with HMAC-SHA256 signing and full delivery tracking.

```mermaid
sequenceDiagram
    participant Event as Platform Event
    participant WebhookSvc as WebhookService
    participant Celery as Celery Worker (webhooks queue)
    participant Dispatcher as WebhookDispatcher
    participant DB as WebhookDelivery Table
    participant Customer as Customer HTTP Endpoint

    Event->>WebhookSvc: dispatch(org_id, event_type, payload)
    WebhookSvc->>DB: Query active endpoints subscribed to event
    loop For each matching endpoint
        WebhookSvc->>Celery: dispatch_webhook_event_task.delay(endpoint_id, payload)
    end
    Celery->>Dispatcher: dispatch(endpoint, payload)
    Dispatcher->>Customer: POST (HMAC-SHA256 signed request)
    alt Success (2xx)
        Dispatcher->>DB: INSERT delivery (status: SUCCESS)
        Dispatcher->>DB: UPDATE endpoint consecutive_failures = 0
    else Failure
        Dispatcher->>DB: INSERT delivery (status: FAILED, error_body)
        Dispatcher->>DB: UPDATE endpoint consecutive_failures += 1
    end
```

### D. Stripe Subscription & Billing Flow

```mermaid
sequenceDiagram
    participant Frontend
    participant SubRouter as SubscriptionRouter
    participant SubSvc as SubscriptionService
    participant Stripe as Stripe API
    participant DB as PostgreSQL

    Frontend->>SubRouter: POST /api/v1/subscriptions/checkout
    SubRouter->>SubSvc: create_checkout_session(org_id, plan)
    SubSvc->>Stripe: Create Checkout Session
    Stripe-->>SubSvc: session.url
    SubSvc-->>Frontend: {checkout_url}

    Note over Stripe,DB: Webhook driven lifecycle events
    Stripe->>SubRouter: POST /api/v1/subscriptions/stripe-webhook
    SubRouter->>SubSvc: handle_stripe_event(event)
    SubSvc->>DB: UPDATE organization_subscriptions (plan_tier, status, period dates)
```

---

## 3. Authentication & Authorization

The platform supports two parallel authentication mechanisms:

| Mechanism | Used By | Token Format | Header |
| :--- | :--- | :--- | :--- |
| **JWT Session Tokens** | Dashboard users (React frontend) | Signed JWT (email, org_id, exp) | `Authorization: Bearer <token>` |
| **API Keys** | Widget integrations, external clients | `sha256(random_key)` stored hash | `X-API-Key: <key>` |

- **Email OTP Flow**: Registration and login use a two-step email OTP flow. A 6-digit OTP is generated, cached in Redis with a short TTL, and dispatched via Celery to the `high_priority` queue.
- **Session Management**: Active sessions are tracked in the `user_sessions` table. Expired sessions are automatically purged by a Celery Beat scheduled task every hour.
- **API Key Scoping**: API keys are scoped per organization and hashed with SHA-256 before storage. The plaintext key is only returned once at creation time.

---

## 4. Structured Outputs & LLM Engine

To eliminate hallucinations and parsing fragility during triage, the platform implements **Pydantic-bounded Structured Outputs** (`TypeVar("T", bound=BaseModel)`).

```python
class OpenAIProvider(LLMProvider):
    MODEL = "gpt-4.1-mini"

    async def complete_structured(self, *, messages: list[dict], response_model: type[T]) -> T:
        response = await client.beta.chat.completions.parse(
            model=self.MODEL,
            messages=messages,
            response_format=response_model,
        )
        return response.choices[0].message.parsed
```

```python
class AIAction(str, Enum):
    ANSWER = "ANSWER"
    ESCALATE = "ESCALATE"

class EscalationDecision(BaseModel):
    action: AIAction
    answer: str | None = None
    reason: str | None = None
```

---

## 5. Async Task Queue: Celery + RabbitMQ

Long-running and asynchronous operations are offloaded to **Celery** workers backed by a **RabbitMQ** broker.

| Queue | Task | Trigger |
| :--- | :--- | :--- |
| `high_priority` | `send_otp_email_task` | User login / registration |
| `emails` | `send_ticket_create_email` | AI escalation creates a ticket |
| `webhooks` | `dispatch_webhook_event_task` | Platform event fired to customer endpoint |
| *(Beat)* | `cleanup_expired_sessions_task` | Every 1 hour via Celery Beat |

---

## 6. Entity Relationship & Domain Data Model

```mermaid
erDiagram
    ORGANIZATIONS ||--o{ ORGANIZATION_MEMBERS : contains
    ORGANIZATIONS ||--o{ KNOWLEDGE_BASES : owns
    ORGANIZATIONS ||--o{ CONVERSATIONS : manages
    ORGANIZATIONS ||--o{ TICKETS : tracks
    ORGANIZATIONS ||--o| ORGANIZATION_SUBSCRIPTIONS : has
    ORGANIZATIONS ||--o{ API_KEYS : issues
    ORGANIZATIONS ||--o{ WEBHOOK_ENDPOINTS : configures
    ORGANIZATIONS ||--o{ ORGANIZATION_SETTINGS : configures
    ORGANIZATIONS ||--o{ ORGANIZATION_USAGE : metered_by
    USERS ||--o{ ORGANIZATION_MEMBERS : joins
    USERS ||--o{ USER_SESSIONS : authenticates_via
    KNOWLEDGE_BASES ||--o{ DOCUMENTS : stores
    KNOWLEDGE_BASES ||--o{ CONVERSATIONS : references
    DOCUMENTS ||--o{ DOCUMENT_CHUNKS : splits_into
    CONVERSATIONS ||--o{ MESSAGES : contains
    CONVERSATIONS ||--o| TICKETS : generates
    MESSAGES ||--o| MESSAGE_FEEDBACK : receives
    TICKETS ||--o{ TICKET_EVENTS : logs
    TICKETS ||--o{ TICKET_NOTES : annotated_by
    WEBHOOK_ENDPOINTS ||--o{ WEBHOOK_DELIVERIES : records
```

| Model | Table | Purpose |
| :--- | :--- | :--- |
| `Organization` | `organizations` | Top-level multi-tenant boundary |
| `User` / `UserSession` | `users`, `user_sessions` | Auth identity & JWT sessions |
| `OrganizationMember` | `organization_members` | Role-based org membership |
| `OrganizationSubscription` | `organization_subscriptions` | Stripe plan & billing status |
| `OrganizationUsage` | `organization_usage` | Metered usage counters per plan |
| `OrganizationSettings` | `organization_settings` | Per-org feature flags & limits |
| `KnowledgeBase` | `knowledge_bases` | Scoped document store per org |
| `Document` / `DocumentChunk` | `documents`, `document_chunks` | Source files & pgvector embeddings |
| `Conversation` / `Message` | `conversations`, `messages` | Chat history per knowledge base |
| `MessageFeedback` | `message_feedback` | Thumbs up/down on AI responses |
| `Ticket` | `tickets` | Escalated support tickets |
| `TicketEvent` | `ticket_events` | Audit log of ticket state changes |
| `TicketNote` | `ticket_notes` | Internal agent notes on tickets |
| `ApiKey` | `api_keys` | Scoped org API keys for widget/external use |
| `WebhookEndpoint` | `webhook_endpoints` | Customer HTTP endpoint registrations |
| `WebhookDelivery` | `webhook_deliveries` | Per-attempt delivery log & status |

---

## 7. Exception Handling & Error Governance

| Domain Exception | Trigger Condition | HTTP Status |
| :--- | :--- | :--- |
| `ConversationNotFoundException` | Conversation UUID not found | `404 Not Found` |
| `MessageNotFoundException` | Message UUID not found | `404 Not Found` |
| `DocumentNotFoundException` | Document UUID not found | `404 Not Found` |
| `DocumentAlreadyExistsException` | Duplicate file in knowledge base | `409 Conflict` |
| `TicketNotFoundException` | Ticket UUID not found | `404 Not Found` |
| `TicketAlreadyExistsException` | Escalating an already-escalated conversation | `409 Conflict` |
| `InvalidCredentialsException` | Bad email/OTP combination | `401 Unauthorized` |
| `OrganizationNotFoundException` | Org UUID not found | `404 Not Found` |
| `ApiKeyNotFoundException` | API Key not found or inactive | `404 Not Found` |
| `WebhookNotFoundException` | Webhook endpoint UUID not found | `404 Not Found` |
| `RateLimitExceededException` | Too many requests from client | `429 Too Many Requests` |
| `SubscriptionLimitExceededException` | Plan quota breached | `402 Payment Required` |

---

## 8. Project Directory Structure

```text
support-ai/
├── alembic.ini                    # Alembic migration configuration
├── pyproject.toml / uv.lock       # Project dependencies managed via uv
├── Dockerfile                     # (Placeholder - not yet implemented)
├── docker-compose.yml             # (Placeholder - not yet implemented)
├── migrations/
│   └── versions/                  # Alembic migration history
├── frontend/                      # React + TypeScript dashboard (Vite)
│   └── src/
│       ├── components/            # UI components (auth, tickets, chat, etc.)
│       └── lib/api.ts             # Typed API client
└── app/
    ├── api/v1/                    # REST API routers
    │   ├── auth.py                # Registration, OTP login, logout
    │   ├── chat.py                # RAG chat endpoint
    │   ├── conversations.py       # Conversation management
    │   ├── documents.py           # Document upload & status
    │   ├── knowledge_bases.py     # Knowledge base CRUD
    │   ├── ticket.py              # Ticket management
    │   ├── ticket_events.py       # Ticket audit event log
    │   ├── ticket_notes.py        # Internal ticket notes
    │   ├── webhooks.py            # Webhook endpoint & delivery management
    │   ├── subscription.py        # Stripe checkout & webhook handler
    │   ├── api_keys.py            # API key issuance & revocation
    │   ├── usage.py               # Usage stats endpoint
    │   ├── organization_settings.py
    │   └── widget.py              # Public embeddable widget endpoints
    ├── core/                      # Settings, plan config, exception handlers, lifespan
    ├── db/                        # Async database engine, session manager, dependencies
    ├── dependencies/              # FastAPI dependency injectors (auth, rate limits)
    ├── dto/                       # Internal Data Transfer Objects
    ├── exceptions/                # Custom domain exceptions
    ├── integrations/              # External SDK clients (OpenAI, Cloud Storage)
    ├── models/                    # SQLAlchemy 2.0 ORM models
    ├── processing/
    │   ├── document/              # File parsers & text chunkers
    │   └── llms/                  # LLM provider factory, base class, OpenAI implementation
    ├── prompts/                   # System prompt templates
    ├── redis/                     # Redis client, cache services, key builders
    ├── repositories/              # Async data access layer (one per domain entity)
    ├── schemas/                   # Pydantic v2 request/response schemas
    ├── services/                  # Core business logic services
    ├── static/                    # Embeddable JS widget & demo HTML
    │   ├── widget.js
    │   └── demo.html
    ├── utils/                     # Helper utilities
    └── workers/
        ├── celery_app.py          # Celery app, queue routing & Beat schedule
        └── tasks.py               # Task definitions (OTP email, ticket email, webhook dispatch, session cleanup)
```

---

## 9. Setup & Local Development

### Prerequisites
- Python 3.12+
- PostgreSQL with `pgvector` extension
- Redis
- RabbitMQ (for Celery)
- Node.js 18+ (for frontend)

### Environment Variables
Create a `.env` file in the project root (see `.env.example`):
```bash
# Database
DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/support_ai"

# OpenAI
OPENAI_API_KEY="sk-..."

# Redis
REDIS_URL="redis://localhost:6379"

# RabbitMQ (Celery broker)
RABBITMQ_URL="amqp://guest:guest@localhost:5672/"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Auth
SECRET_KEY="your-jwt-secret-key"
```

### Apply Database Migrations
```bash
uv run alembic upgrade head
```

### Run the Development Server
```bash
uv run fastapi dev app/main.py
```
Interactive API docs: `http://localhost:8000/docs`

### Run Celery Workers
```bash
# Worker (all queues)
uv run celery -A app.workers.celery_app worker --loglevel=info -Q high_priority,emails,webhooks

# Beat scheduler (periodic tasks)
uv run celery -A app.workers.celery_app beat --loglevel=info
```

### Run the Frontend Dashboard
```bash
cd frontend
npm install
npm run dev
```
Frontend: `http://localhost:3000`

### Run Tests
```bash
uv run pytest tests/
```
