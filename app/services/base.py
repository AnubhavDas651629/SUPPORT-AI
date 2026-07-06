from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from uuid import UUID
from app.exceptions.auth import PermissionDeniedException
from app.exceptions.organization import OrganizationNotFoundException
from app.models.user import User
from app.repositories.organization_member_repository import OrganizationMember
from app.repositories.organization_member_repository import OrganizationRole

from app.repositories.organization_member_repository import OrganizationMemberRepository
from app.repositories.organization_repository import OrganizationRepository

class BaseService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.organization_repository = OrganizationRepository(session)
        self.membership_repository = OrganizationMemberRepository(session)


    async def _require_owner(self, *, organization_id:UUID, current_user: User) -> OrganizationMember:
        organization = await self.organization_repository.get_by_id_for_user(
            organization_id=organization_id,
            user_id=current_user.id
        )
        if organization is None:
            raise OrganizationNotFoundException()

        # if this function returns org this means we have identified the org and the current user is a part of the org, now in order to invite, next step is to check the role of the current user, that decides he they can invite a person
        #the purpose of defining membership is just because the return of this will have the role attribute which we need
        membership = await self.membership_repository.get_membership(
            organization_id=organization_id,
            user_id=current_user.id,
        )
        if (membership is None or membership.role != OrganizationRole.OWNER):
            raise PermissionDeniedException()

        return membership


    async def _require_member(self, *, organization_id:UUID, current_user:User) -> OrganizationMember:
        organization = await self.organization_repository.get_by_id_for_user(
            organization_id=organization_id,
            user_id=current_user.id
        )
        if organization is None:
            raise OrganizationNotFoundException()

        membership = await self.membership_repository.get_membership(
            organization_id=organization_id,
            user_id=current_user.id,
        )
        if membership is None:
            raise PermissionDeniedException()
        return membership