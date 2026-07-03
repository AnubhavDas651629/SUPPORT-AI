from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import Base
from app.models import organization
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

