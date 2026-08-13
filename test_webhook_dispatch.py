import asyncio
from uuid import UUID
from app.db.session import AsyncSessionLocal
from app.models.organization import Organization
from sqlalchemy import select
from app.utils.webhook_dispatch import _dispatch_direct
from app.core.webhook_events import WebhookEventType

async def test():
    async with AsyncSessionLocal() as session:
        org = (await session.execute(select(Organization))).scalars().first()
        if not org:
            print("No org found")
            return
        print(f"Testing webhook for org {org.id}")
        await _dispatch_direct(
            str(org.id),
            WebhookEventType.MESSAGE_CREATED.value,
            {"test": "payload"}
        )

if __name__ == "__main__":
    asyncio.run(test())
