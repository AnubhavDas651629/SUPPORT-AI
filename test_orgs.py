import asyncio
from app.db.session import AsyncSessionLocal
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.user import User
from sqlalchemy import select
from sqlalchemy.orm import selectinload

async def main():
    async with AsyncSessionLocal() as session:
        users = (await session.execute(select(User).where(User.email.contains("anubhav")))).scalars().all()
        for user in users:
            print(f"User: {user.email}")
            members = (await session.execute(
                select(OrganizationMember)
                .options(selectinload(OrganizationMember.organization))
                .where(OrganizationMember.user_id == user.id)
            )).scalars().all()
            for member in members:
                print(f"  Org: {member.organization.name} (id: {member.organization.id})")

asyncio.run(main())
