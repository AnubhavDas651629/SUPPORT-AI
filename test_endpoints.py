from app.db.session import AsyncSessionLocal
from sqlalchemy import select
from app.models.webhook import WebhookEndpoint
import asyncio

async def test():
    async with AsyncSessionLocal() as session:
        endpoints = (await session.execute(select(WebhookEndpoint))).scalars().all()
        for ep in endpoints:
            print(f"Endpoint: {ep.url}, Org: {ep.organization_id}, Events: {ep.subscribed_events}")
if __name__ == "__main__":
    asyncio.run(test())
