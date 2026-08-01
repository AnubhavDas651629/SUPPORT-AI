from slugify import slugify
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.exceptions.organization import (
    OrganizationAlreadyExistsException,
    OrganizationNotFoundException,
    MemberNotFoundException,
)
from app.exceptions.auth import AlreadyOrganizationMemberException, UserNotFoundException, PermissionDeniedException 
from app.models import Organization, organization
from app.models.organization_member import OrganizationMember, OrganizationRole
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.repositories.organization_member_repository import OrganizationMemberRepository
from app.repositories.organization_repository import OrganizationRepository
from app.schemas.member import OrganizationMemberResponse
from app.services.base import BaseService

from app.redis.cache_services import RedisCacheService
from app.redis.keys import RedisKeys
from app.schemas.organization import OrganizationResponse

class OrganizationService(BaseService):
    def __init__(self, session: AsyncSession):
        super().__init__(session)
        self.session = session
        self.organization_repository = OrganizationRepository(session)      
        self.membership_repository = OrganizationMemberRepository(session)
        self.user_repository = UserRepository(session)


    async def create(self, *, current_user: User, name: str):
        slug = slugify(name)

        existing = await self.organization_repository.get_by_slug(slug)

        if existing is not None:
            raise OrganizationAlreadyExistsException()

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
        cache_service = RedisCacheService(self.redis)
        cache_key = RedisKeys.cache_org(str(organization_id))

        #try fetching from redis cache
        cached_org = await cache_service.get_json(key=cache_key, schema_cls=OrganizationResponse)
        if cached_org:
            # Verify membership authorization
            await self._require_member(
                organization_id=organization_id,
                current_user=current_user
            )
            return Organization(
                id=cached_org.id,
                name=cached_org.name,
                slug=cached_org.slug
            )

        # Cache Miss -> Query PostgreSQL DB
        organization = (
            await self.organization_repository.get_by_id_for_user(
                organization_id=organization_id,
                user_id=current_user.id
            )
        )
        if organization is None:
            raise OrganizationNotFoundException()

        # Store the result in Redis with 1 hour TTL
        await cache_service.set_json(
            key=cache_key,
            value=OrganizationResponse.model_validate(organization),
            ttl=3600
        )
        return organization


    # which org should abc be added to, who is trying to invite abc, email of abc, what role should abc get
    async def invite_member(self, *, organization_id: UUID, current_user: User, email:str, role: OrganizationRole):
        await self._require_owner(
        organization_id=organization_id,
        current_user=current_user,
        )
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


    async def list_members(self, *, organization_id: UUID, current_user: User) -> list[OrganizationMemberResponse]:
        organization = await self.organization_repository.get_by_id_for_user(
            organization_id=organization_id,
            user_id = current_user.id
        )
        if organization is None:
            raise OrganizationNotFoundException()

        members = await self.membership_repository.list_members(
            organization_id=organization_id,
        )

        return [
            OrganizationMemberResponse(
                id=user.id,
                full_name=user.full_name,
                email=user.email,
                role=membership.role
            )
            for user, membership in members
        ]

    async def update_member_role(self, *, organization_id: UUID, target_user_id: UUID, current_user: User, role: OrganizationRole):
        await self._require_owner(
            organization_id=organization_id,
            current_user=current_user,
        )
        
        target_membership = await self.membership_repository.get_membership(
            organization_id=organization_id,
            user_id=target_user_id,
        )
        if target_membership is None:
            raise MemberNotFoundException()

        if target_membership.role == OrganizationRole.OWNER:
            raise PermissionDeniedException()
        
        # Owner cannot demote themselves
        if target_user_id == current_user.id:
            raise PermissionDeniedException()

        target_membership.role = role
        await self.session.commit()
        return target_membership

    #an owner(only) can remove a member
    async def remove_member(self, *, organization_id:UUID, target_user_id:UUID, current_user: User):
        await self._require_owner(
            organization_id=organization_id,
            current_user=current_user,
        )

        target_membership = await self.membership_repository.get_membership(
            organization_id=organization_id,
            user_id=target_user_id,
        )
        if target_membership is None:
            raise MemberNotFoundException()

        if target_membership.role == OrganizationRole.OWNER:
            raise PermissionDeniedException()

        if target_user_id == current_user.id:
            raise PermissionDeniedException()

        await self.membership_repository.delete(target_membership)
        await self.session.commit()

    



