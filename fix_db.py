from app.db.session import AsyncSessionLocal
from sqlalchemy import select
from app.models.webhook import WebhookEndpoint
import asyncio

async def fix():
    async with AsyncSessionLocal() as session:
        endpoints = (await session.execute(select(WebhookEndpoint))).scalars().all()
        for ep in endpoints:
            if 'ticket.escalated' in ep.subscribed_events:
                events = ep.subscribed_events.copy()
                events.remove('ticket.escalated')
                events.append('ticket.created')
                ep.subscribed_events = events
                print(f"Fixed events for {ep.id}")
        await session.commit()
if __name__ == "__main__":
    asyncio.run(fix())
