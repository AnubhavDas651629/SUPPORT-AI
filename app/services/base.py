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

from app.redis.client import redis_client
from app.redis.keys import RedisKeys

class BaseService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.organization_repository = OrganizationRepository(session)
        self.membership_repository = OrganizationMemberRepository(session)
        self.redis = redis_client


    async def _require_owner(self, *, organization_id:UUID, current_user: User) -> OrganizationMember:
        cache_key = RedisKeys.cache_member(str(organization_id), str(current_user.id))

        # Try fetching cached role from Redis
        cached_role = await self.redis.get(cache_key)
        if cached_role:
            if cached_role != OrganizationRole.OWNER.value:
                raise PermissionDeniedException()
            return OrganizationMember(
                organization_id=organization_id,
                user_id=current_user.id,
                role=OrganizationRole(cached_role)
            )

        # Cache Miss: Query PostgreSQL DB
        organization = await self.organization_repository.get_by_id_for_user(
            organization_id=organization_id,
            user_id=current_user.id
        )
        if organization is None:
            raise OrganizationNotFoundException()

        # the purpose of defining membership is just because the return of this will have the role attribute which we need
        membership = await self.membership_repository.get_membership(
            organization_id=organization_id,
            user_id=current_user.id,
        )
        if (membership is None or membership.role != OrganizationRole.OWNER):
            raise PermissionDeniedException()
        
        # Store role in Redis with 1 hour TTL
        await self.redis.set(cache_key, membership.role.value, ex=3600)

        return membership


    async def _require_member(self, *, organization_id: UUID, current_user: User) -> OrganizationMember:
        cache_key = RedisKeys.cache_member(str(organization_id), str(current_user.id))

        #Try fetching cached role from Redis
        cached_role = await self.redis.get(cache_key)
        if cached_role:
            member = OrganizationMember(
                organization_id=organization_id,
                user_id=current_user.id,
                role=OrganizationRole(cached_role)
            )
            return member

        # Cache Miss: Query PostgresSQL DB
        organization = await self.organization_repository.get_by_id_for_user(
            organization_id=organization_id,
            user_id=current_user.id
        )
        if organization is None:
            raise OrganizationNotFoundException()

        membership = await self.membership_repository.get_membership(
            organization_id=organization_id,
            user_id=current_user.id
        )

        if membership is None:
            raise PermissionDeniedException()
        
        #store role in redis with 1 hour TTL
        await self.redis.set(cache_key, membership.role.value, ex=3600)

        return membership