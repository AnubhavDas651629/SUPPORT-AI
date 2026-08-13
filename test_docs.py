import asyncio
from app.db.session import AsyncSessionLocal
from app.models.document import Document
from app.models.knowledge_base import KnowledgeBase
from app.models.organization import Organization
from sqlalchemy import select
from sqlalchemy.orm import selectinload

async def main():
    async with AsyncSessionLocal() as session:
        docs = (await session.execute(
            select(Document)
            .where(Document.original_filename.contains("Anubhav"))
        )).scalars().all()
        for doc in docs:
            print(f"Doc: {doc.original_filename} (KB: {doc.knowledge_base_id})")

asyncio.run(main())
