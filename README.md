# Support-AI: Enterprise Agentic Customer Support & RAG Platform

Support-AI is an asynchronous, multi-tenant AI customer support platform built with Python 3.12, FastAPI, SQLAlchemy 2.0 (AsyncSession), and PostgreSQL (pgvector). The system integrates Retrieval-Augmented Generation (RAG) with automated support ticket escalation, dynamic conversation management, document processing, and structured LLM outputs.

---

## 1. System Architecture & Design Principles

The application adheres to a strict Layered Architecture with clear separation of concerns across presentation, business logic, persistence layers, and external integrations.

```mermaid
graph TD
    Client[HTTP Client / Frontend] --> Router[FastAPI API Layer v1]
    Router --> Schema[Pydantic v2 Request/Response Schemas]
    Router --> Service[Service Layer - Business Logic]
    
    subgraph Core Services
        Service --> ChatSvc[ChatService]
        Service --> EscSvc[EscalationService]
        Service --> RetSvc[RetrievalService]
        Service --> DocSvc[DocumentService]
        Service --> TktSvc[TicketService]
    end
    
    subgraph Data Transfer Layer
        ChatSvc <--> DTO[Internal Data Transfer Objects - DTOs]
        EscSvc <--> DTO
    end

    Service --> Repo[Repository Layer - Data Access]
    Repo --> ORM[SQLAlchemy 2.0 ORM Models]
    ORM --> DB[(PostgreSQL + pgvector Database)]
    
    subgraph External Integrations
        ChatSvc --> LLMFac[LLMFactory / OpenAIProvider]
        EscSvc --> LLMFac
        DocSvc --> BgTask[Background Tasks - DocumentProcessor]
        BgTask --> Parser[File Parsers & Chunkers]
        LLMFac --> OpenAI[OpenAI API - gpt-4.1-mini & Embeddings]
    end
```

### Architectural Highlights
- **Strict Layered Boundary**: API routes (`app/api/v1`) never interact directly with database ORM models or raw SQL queries. Controllers only instantiate services and map internal Domain Transfer Objects (DTOs) or domain models into user-facing Pydantic API responses.
- **DTO vs. API Schema Decoupling**: Internal domain structs (`EscalationResult`, `ChatResult`, `Citation`, `EscalationDecision`) are kept distinct from presentation schemas (`ChatResponse`, `CitationResponse`). This ensures changes to API formats do not force refactoring of core business logic.
- **Explicit Transaction Management**: All database mutations explicitly manage session lifecycle and durability (`await self.session.flush()`, `await self.session.commit()`). Repositories flush commands to the active transaction buffer, while service methods govern atomic commits across multi-repository operations.
- **Asynchronous Eager Loading**: Avoids async lazy-loading `MissingGreenlet` errors by explicitly declaring relationship loading strategies (`selectinload(Conversation.messages)`) inside repository queries.

---

## 2. Core Functional Pipelines

### A. Document Ingestion & Vector Processing
When a user uploads a reference document to a knowledge base, the file is processed asynchronously to avoid blocking API threads.

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
    Router-->>Client: 2022 Accepted (Document Row)
    
    Note over Processor,DB: Asynchronous Background Execution
    Processor->>Repo: get_by_id(document_id)
    Processor->>Processor: ParserFactory.parse(file_path)
    Processor->>Processor: TextChunker.chunk(text, chunk_size, overlap)
    Processor->>OpenAI: Generate Embeddings (text-embedding-3-small)
    Processor->>DB: Batch INSERT INTO document_chunks (embedding vector)
    Processor->>DB: UPDATE documents SET status = 'READY'
```

### B. Conversational RAG & Automated Escalation Flow
Every customer query undergoes automated intent analysis via structured LLM generation before an answer is delivered. If the AI detects requests beyond its autonomous scope (such as refunds, account deletions, legal inquiries, or complex system actions), it triggers instant ticket escalation.

```mermaid
sequenceDiagram
    participant User
    participant ChatAPI as ChatController
    participant ChatSvc as ChatService
    participant RetSvc as RetrievalService
    participant EscSvc as EscalationService
    participant LLM as OpenAIProvider (gpt-4.1-mini)
    participant TktSvc as TicketService
    participant DB as PostgreSQL
    
    User->>ChatAPI: POST /api/v1/chat (question, conversation_id)
    ChatAPI->>ChatSvc: answer(conversation_id, question)
    ChatSvc->>DB: INSERT Message (role: USER, content: question)
    ChatSvc->>RetSvc: retrieve(knowledge_base_id, question)
    RetSvc->>DB: Cosine Similarity Search via pgvector (top-K chunks)
    
    ChatSvc->>EscSvc: process(conversation, history, chunks, question)
    EscSvc->>EscSvc: _build_messages(customer_support/escalation.txt)
    EscSvc->>LLM: complete_structured(messages, response_model: EscalationDecision)
    LLM-->>EscSvc: EscalationDecision(action, answer, reason)
    
    alt Action == AIAction.ANSWER
        EscSvc-->>ChatSvc: EscalationResult(answer: decision.answer, escalated: False)
    else Action == AIAction.ESCALATE
        EscSvc->>TktSvc: create_ticket(conversation_id, priority: MEDIUM)
        TktSvc->>DB: INSERT INTO tickets (status: OPEN)
        EscSvc-->>ChatSvc: EscalationResult(answer: handoff_prompt, escalated: True, ticket_id)
    end
    
    ChatSvc->>DB: INSERT Message (role: ASSISTANT, content: result.answer)
    ChatSvc->>LLM: _generate_title(question, answer)
    ChatSvc->>DB: UPDATE conversations SET title = generated_title
    ChatAPI-->>User: ChatResponse(answer, citations, message_id)
```

---

## 3. Structured Outputs & LLM Engine (`OpenAIProvider`)

To eliminate hallucinations and parsing fragility during triage and classification tasks, the platform implements Pydantic-bounded Structured Outputs (`TypeVar("T", bound=BaseModel)`).

```python
T = TypeVar("T", bound=BaseModel)

class LLMProvider(ABC):
    @abstractmethod
    async def complete_structured(self, *, messages: list[dict], response_model: type[T]) -> T:
        raise NotImplementedError
```

### Implementation Mechanics inside `OpenAIProvider`
The provider maps Pydantic schemas directly into OpenAI's `response_format` constraint engine using the async `client.beta.chat.completions.parse` endpoint:

```python
class OpenAIProvivder(LLMProvider):
    MODEL = "gpt-4.1-mini"
    
    async def complete_structured(self, *, messages: list[dict], response_model: type[T]) -> T:
        response = await client.beta.chat.completions.parse(
            model=self.MODEL,
            messages=messages,
            response_format=response_model,
        )
        return response.choices[0].message.parsed
```

When `EscalationService` invokes `complete_structured(response_model=EscalationDecision)`, the model is constrained at the token level to produce valid JSON that conforms precisely to the schema:

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

## 4. Entity Relationship & Domain Data Model

The data layer is structured around multi-tenant isolation, high-performance vector retrieval, and complete audit tracking across interactions.

```mermaid
erDiagram
    ORGANIZATIONS ||--o{ ORGANIZATION_MEMBERS : contains
    ORGANIZATIONS ||--o{ KNOWLEDGE_BASES : owns
    ORGANIZATIONS ||--o{ CONVERSATIONS : manages
    ORGANIZATIONS ||--o{ TICKETS : tracks
    
    USERS ||--o{ ORGANIZATION_MEMBERS : joins
    
    KNOWLEDGE_BASES ||--o{ DOCUMENTS : stores
    KNOWLEDGE_BASES ||--o{ CONVERSATIONS : references
    
    DOCUMENTS ||--o{ DOCUMENT_CHUNKS : splits_into
    
    CONVERSATIONS ||--o{ MESSAGES : contains
    CONVERSATIONS ||--o| TICKETS : generates
    
    MESSAGES ||--o| MESSAGE_FEEDBACK : receives

    ORGANIZATIONS {
        UUID id PK
        String name
        String slug UK
        DateTime created_at
        DateTime updated_at
    }

    KNOWLEDGE_BASES {
        UUID id PK
        UUID organization_id FK
        String name
        DateTime created_at
    }

    DOCUMENTS {
        UUID id PK
        UUID knowledge_base_id FK
        String original_filename
        String storage_path
        Enum status
        DateTime created_at
    }

    DOCUMENT_CHUNKS {
        UUID id PK
        UUID document_id FK
        Integer chunk_index
        Text content
        Vector embedding
    }

    CONVERSATIONS {
        UUID id PK
        UUID organization_id FK
        UUID knowledge_base_id FK
        String title
        DateTime created_at
    }

    MESSAGES {
        UUID id PK
        UUID conversation_id FK
        Enum role
        Text content
        DateTime created_at
    }

    TICKETS {
        UUID id PK
        UUID conversation_id FK
        UUID organization_id FK
        Enum status
        Enum priority
        String subject
        Boolean created_by_ai
        DateTime created_at
    }

    MESSAGE_FEEDBACK {
        UUID id PK
        UUID message_id FK
        Boolean is_positive
        String comment
        DateTime created_at
    }
```

---

## 5. Exception Handling & Error Governance

The platform defines clear domain boundaries using custom Python exception hierarchies (`app/exceptions/`), mapped directly to HTTP status codes via centralized exception handlers (`app/core/exception_handlers.py`).

| Domain Exception | Trigger Condition | HTTP Status | Response Format |
| :--- | :--- | :--- | :--- |
| `ConversationNotFoundException` | Conversation UUID missing from database | `404 Not Found` | `{"detail": "Conversation not found."}` |
| `MessageNotFoundException` | Message UUID missing when adding feedback | `404 Not Found` | `{"detail": "Message not found."}` |
| `DocumentNotFoundException` | Document UUID missing during chunk processing | `404 Not Found` | `{"detail": "Document not found."}` |
| `DocumentAlreadyExistsException` | Duplicate file upload inside knowledge base | `409 Conflict` | `{"detail": "Document already exists."}` |
| `TicketNotFoundException` | Ticket UUID missing from query or update attempt | `404 Not Found` | `{"detail": "Ticket not found."}` |
| `TicketAlreadyExistsException` | Attempting to escalate a conversation twice | `409 Conflict` | `{"detail": "Ticket already exists."}` |

---

## 6. Project Directory Structure

```text
support-ai/
├── alembic.ini                   # Alembic database migration configuration
├── pyproject.toml / uv.lock      # Project dependencies managed via uv
├── main.py                       # FastAPI application entry point
├── migrations/
│   └── versions/                 # Alembic migration scripts (e.g., tickets, feedback)
└── app/
    ├── api/v1/                   # REST API endpoints (chat, conversations, tickets, documents)
    ├── core/                     # Core settings, configurations, and exception handlers
    ├── db/                       # Database session manager, async engines, dependencies
    ├── dto/                      # Internal Data Transfer Objects (chat, citation, escalation)
    ├── exceptions/               # Custom domain exceptions (ticket, conversation, document)
    ├── integrations/             # External SDK clients (OpenAI, Cloud Storage)
    ├── models/                   # SQLAlchemy ORM models and pgvector mappings
    ├── processing/
    │   ├── document/             # File parsers and text chunkers
    │   └── llms/                 # LLM provider factory, Base provider, OpenAI implementation
    ├── prompts/                  # System prompts and templates (escalation, title, user response)
    ├── repositories/             # Async data access layer across all database entities
    ├── schemas/                  # Pydantic v2 schemas for API validation and serialization
    ├── services/                 # Core business logic layer
    └── utils/                    # Helper utilities (prompt loaders, file handling)
```

---

## 7. Setup & Verification Commands

### Environment Setup
Create a `.env` file with your database connection string and OpenAI API key:
```bash
DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/support_ai"
OPENAI_API_KEY="sk-..."
```

### Apply Database Migrations
Synchronize the PostgreSQL schema using `uv` and `alembic`:
```bash
uv run alembic upgrade head
```

### Run the Development Server
Launch the asynchronous FastAPI server:
```bash
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
Interactive API documentation will be available at `http://localhost:8000/docs`.
