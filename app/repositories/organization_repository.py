from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import query

from app.models.organization import Organization
from app.models.organization import OrganizationMember
from app.db.base import Base
from app.models import Organization
from app.models.organization import Organization
from app.repositories.base import BaseRepository

class OrganizationRepository(BaseRepository):
    async def create(self, *, name:str, slug:str) -> Organization:
        organization = Organization(
            name=name,
            slug=slug,
        )
        self.session.add(organization)
        await self.session.flush()
        return organization

    async def list_for_user(self, *, user_id:UUID) -> list[Organization]:
        query = (
            select(Organization)
            .join(OrganizationMember)
            .where(
                OrganizationMember.user_id == user_id
            )
        )
        result = await self.session.execute(query)

        return list(result.scalars().all())

    async def get_by_id_for_user(self, *, organization_id: UUID, user_id: UUID) -> Organization | None:
        query = (
            select(Organization)
            .join(OrganizationMember)
            .where(
                Organization.id == organization_id,
                OrganizationMember.user_id == user_id,
            )
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
    
