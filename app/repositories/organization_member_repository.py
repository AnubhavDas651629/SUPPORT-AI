from uuid import UUID

from app.models.organization_member import (
    OrganizationMember,
    OrganizationRole
)
from app.repositories.base import BaseRepository

class OrganizationMemberRepository(BaseRepository):
    async def create(self, *, organization_id: UUID, user_id: UUID, role: OrganizationRole) -> OrganizationMember:
        membership = OrganizationMember(
            organization_id=organization_id,
            user_id=user_id,
            role=role
        )
        self.session.add(membership)
        await self.session.flush()
        return membership
