from slugify import slugify
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.exceptions.organization import OrganizationNotFoundException
from app.models import Organization, organization
from app.models.organization_member import OrganizationRole
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.repositories.organization_member_repository import OrganizationMemberRepository
from app.repositories.organization_repository import OrganizationRepository

class OrganizationService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.organization_repository = OrganizationRepository(session)      
        self.membership_repository = OrganizationMemberRepository(session)
        self.user_repository = UserRepository(session)
    async def create(self, *, current_user: User, name: str):
        slug = slugify(name)

        organization = await self.organization_repository.create(
            name=name,
            slug=slug,
        )
        await self.membership_repository.create(
            organization_id=organization.id,
            user_id=current_user.id,
            role=OrganizationRole.OWNER,
        )
        await self.session.commit()
        return organization

    async def list_organizations(self, *, current_user:User,) -> list[Organization]:
        return await self.organization_repository.list_for_user(
            user_id=current_user.id
        )

    async def get_organization(self, *, organization_id: UUID, current_user: User) -> Organization:
        organization = (
            await self.organization_repository.get_by_id_for_user(
                organization_id=organization_id,
                user_id=current_user.id,
            )
        )
        if organization is None:
            raise OrganizationNotFoundException()

        return organization

    # which org should abc be added to, who is trying to invite abc, email of abc, what role should abc get
    async def invite_member(self, *, organization_id: UUID, current_user: User, email:str, role: OrganizationRole):
        organization = await self.organization_repository.get_by_id_for_user(
            organization_id=organization_id,
            user_id=current_user.id
        )
        if organization is None:
            raise OrganizationNotFoundException()

        # if this function returns org this means we have identified the org and the current user is a part of the org, now in order to invite, next step is to check the role of the current user, that decides he they can invite a person
        membership = await self.membership_repository.get_membership(
            organization_id=organization_id,
            user_id=current_user.id,
        )
        if (membership is None or membership.role != OrganizationRole.OWNER):
            raise PermissionDeniedException()

        #if till here this means the inviter is the owner
        #now we check is the invited user has registered or not
        invited_user = await self.user_repository.get_by_email(
            email=email
        )
        if invited_user is None:
            raise UserNotFoundException()

        #Now we are checking if the invited member is already a part of the org or not as we donnot want duplicates
        existing_membership = await self.membership_repository.get_membership(
            organization_id=organization_id,
            user_id=invited_user.id
        )
        if existing_membership is not None:
            raise AlreadyOrganizationMemberException()

        created_membership = await self.membership_repository.create(
            organization_id=organization_id,
            user_id=invited_user.id,
            role=role,
        )
        await self.session.commit()
        return created_membership




