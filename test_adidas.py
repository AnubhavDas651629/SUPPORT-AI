import asyncio
from app.db.session import AsyncSessionLocal
from app.models.organization_member import OrganizationMember
from app.models.user import User
from sqlalchemy import select
from sqlalchemy.orm import selectinload

async def main():
    async with AsyncSessionLocal() as session:
        members = (await session.execute(
            select(OrganizationMember)
            .options(selectinload(OrganizationMember.user))
            .where(OrganizationMember.organization_id == "57a8ca9b-be34-44cc-9625-3ce4b068773d")
        )).scalars().all()
        for member in members:
            print(f"Adidas Member: {member.user.email} (id: {member.user.id})")

asyncio.run(main())
