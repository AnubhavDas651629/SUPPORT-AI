import asyncio
from app.db.session import AsyncSessionLocal
from app.models.organization_member import OrganizationMember
from app.models.user import User
from app.models.organization import Organization
from sqlalchemy import select
from sqlalchemy.orm import selectinload

async def main():
    async with AsyncSessionLocal() as session:
        members = (await session.execute(
            select(OrganizationMember)
            .options(selectinload(OrganizationMember.user), selectinload(OrganizationMember.organization))
            .where(OrganizationMember.organization_id == "dae6d081-1748-4bc5-ba96-163a97c41a11")
        )).scalars().all()
        for member in members:
            print(f"Acme Corp Member: {member.user.email} (id: {member.user.id})")

asyncio.run(main())
