import asyncio
from app.db.session import AsyncSessionLocal
from app.models.organization import Organization
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as session:
        orgs = (await session.execute(select(Organization))).scalars().all()
        for org in orgs:
            print(f"Org: {org.name} (id: {org.id})")

asyncio.run(main())
