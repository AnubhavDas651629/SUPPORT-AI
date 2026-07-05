from sqlalchemy import select
from uuid import UUID

from sqlalchemy.orm import query

from app.models.organization_member import (
    OrganizationMember,
    OrganizationRole
)
from app.models.user import User
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
    
    #Does user belongs to this , if yes then it can invite others
    async def get_membership(self, *, organization_id: UUID, user_id: UUID) -> OrganizationMember:
        query = (
            select(OrganizationMember)
            .where(
                OrganizationMember.organization_id == organization_id,
                OrganizationMember.user_id == user_id,
                )
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    #List every member belong to this org
    async def list_members(self, *, organization_id:UUID) -> list[tuple[User, OrganizationMember]]:
        query = (
            select(User, OrganizationMember)
            .join(
                OrganizationMember,
                User.id == OrganizationMember.user_id
            )
            .where(
                OrganizationMember.organization_id == organization_id,
            )
        )
        result = await self.session.execute(query)
        return list(result.all())

    async def delete(self, membership: OrganizationMember,) -> None:
        await self.session.delete(membership)

