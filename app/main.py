from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.db.dependencies import get_db
from app.api.v1 import documents
from app.api.v1.auth import router as auth_router
from app.api.v1 import chat
from app.api.v1 import messages
from app.api.v1 import ticket_events
from app.api.v1 import ticket
from app.api.v1 import ticket_notes
from app.api.v1 import test
from app.api.v1 import redis_test
from app.api.v1 import organization_settings
from app.api.v1 import api_keys
from app.api.v1 import webhooks
from app.api.v1 import widget
from app.api.v1 import conversations
from app.api.v1 import knowledge_bases
from app.api.v1.users import router as users_router
from app.api.v1.organization_member import router as organization_member_router
from app.api.v1.organizations import router as organization_router
from app.core.exception_handlers import register_exception_handlers
from app.core.lifespan import lifespan
from app.api.v1.subscription import router as subscription_router, webhook_router as stripe_webhook_router
from app.api.v1 import usage
from app.api.v1 import health
from app.core.logging import setup_logging
from app.middleware.logging_middleware import LoggingMiddleware
from asgi_correlation_id import CorrelationIdMiddleware
from fastapi.middleware.gzip import GZipMiddleware

app = FastAPI(
    title="SupportAI",
    description="AI-powered customer support platform",
    version="0.1.0",
    lifespan=lifespan
)
setup_logging(json_logs=False)


app.mount("/static", StaticFiles(directory="app/static"), name="static")
app.add_middleware(LoggingMiddleware),
app.add_middleware(CorrelationIdMiddleware),
app.add_middleware(GZipMiddleware, minimum_size=1000),

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(organization_member_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(organization_router, prefix="/api/v1")
app.include_router(knowledge_bases.router, prefix="/api/v1")
app.include_router(documents.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(messages.router, prefix="/api/v1")
app.include_router(test.router, prefix="/api/v1")
app.include_router(api_keys.router, prefix="/api/v1")
app.include_router(redis_test.router, prefix="/api/v1")
app.include_router(conversations.router, prefix="/api/v1")
app.include_router(ticket.router, prefix="/api/v1")
app.include_router(webhooks.router, prefix="/api/v1")
app.include_router(widget.router)
app.include_router(ticket_events.router, prefix="/api/v1")
app.include_router(ticket_notes.router, prefix="/api/v1")
app.include_router(subscription_router, prefix="/api/v1")
app.include_router(stripe_webhook_router, prefix="/api/v1")
app.include_router(usage.router, prefix="/api/v1")
app.include_router(organization_settings.router, prefix="/api/v1")
app.include_router(health.router, prefix="/api/v1")



@app.get("/")
async def root():
    return {"message": "Welcome to SupportAI"}

@app.get("/db-test")
async def db_test():
    async for db in get_db():
        result = await db.execute(text("SELECT 1"))
        return {"result": result.scalar()}

