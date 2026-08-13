import asyncio
from app.db.session import AsyncSessionLocal
from app.models.knowledge_base import KnowledgeBase
from app.models.organization import Organization
from sqlalchemy import select
from sqlalchemy.orm import selectinload

async def main():
    async with AsyncSessionLocal() as session:
        kbs = (await session.execute(
            select(KnowledgeBase).options(selectinload(KnowledgeBase.organization))
        )).scalars().all()
        for kb in kbs:
            print(f"KB: {kb.name} (id: {kb.id}), Org: {kb.organization.name} (id: {kb.organization.id})")

asyncio.run(main())
