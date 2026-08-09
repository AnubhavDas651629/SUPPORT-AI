from fastapi import FastAPI
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

from app.api.v1 import conversations
from app.api.v1 import knowledge_bases
from app.api.v1.users import router as users_router
from app.api.v1.organization_member import router as organization_member_router
from app.api.v1.organizations import router as organization_router
from app.core.exception_handlers import register_exception_handlers
from app.core.lifespan import lifespan
from app.api.v1.subscription import router as subscription_router, webhook_router as stripe_webhook_router
from app.api.v1 import usage

app = FastAPI(
    title="SupportAI",
    description="AI-powered customer support platform",
    version="0.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(organization_member_router, prefix="/api/v1")
app.include_router(auth_router,prefix="/api/v1")
app.include_router(users_router,prefix="/api/v1",)
app.include_router(organization_router,prefix="/api/v1",)
app.include_router(knowledge_bases.router)
app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(messages.router)
app.include_router(test.router)
app.include_router(api_keys.router)
app.include_router(redis_test.router)
app.include_router(conversations.router)
app.include_router(ticket.router)
app.include_router(ticket_events.router, prefix="/api/v1")
app.include_router(ticket_notes.router)
app.include_router(subscription_router, prefix="/api/v1")
app.include_router(stripe_webhook_router, prefix="/api/v1")
app.include_router(usage.router, prefix="/api/v1")
app.include_router(organization_settings.router, prefix="/api/v1")



@app.get("/")
async def root():
    return {"message": "Welcome to SupportAI"}

@app.get("/db-test")
async def db_test():
    async for db in get_db():
        result = await db.execute(text("SELECT 1"))
        return {"result": result.scalar()}

