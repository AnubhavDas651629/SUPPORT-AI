import asyncio
import httpx
from app.db.session import AsyncSessionLocal
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.knowledge_base import KnowledgeBase
from app.models.user import User
from app.core.security import create_access_token
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as session:
        member = (await session.execute(select(OrganizationMember))).scalars().first()
        org = (await session.execute(select(Organization).where(Organization.id == member.organization_id))).scalars().first()
        kb = (await session.execute(select(KnowledgeBase).where(KnowledgeBase.organization_id == org.id))).scalars().first()
        token = create_access_token(member.user_id)
        
        async with httpx.AsyncClient() as client:
            files = {'file': ('test.pdf', b'fake pdf content that will crash parser', 'application/pdf')}
            headers = {'Authorization': f'Bearer {token}'}
            res = await client.post(
                f"http://localhost:8000/api/v1/organizations/{org.id}/knowledge-bases/{kb.id}/documents",
                headers=headers,
                files=files
            )
            print("Status:", res.status_code)
            print("Response:", res.text)

asyncio.run(main())
