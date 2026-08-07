from uuid import UUID
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.functions import current_user
from app.exceptions.auth import PermissionDeniedException
from app.exceptions.organization import (
    OrganizationNotFoundException,
    KnowledgeBaseNotFoundException,
    KnowledgeBaseAlreadyExistsException,
)
from app.models import knowledge_base
from app.models.knowledge_base import KnowledgeBase
from app.models.user import User
from app.models.organization_member import OrganizationMember
from app.schemas.member import OrganizationRole
from app.repositories.knowledge_base_repository import KnowledgeBaseRepository
from app.repositories.organization_member_repository import OrganizationMemberRepository
from app.repositories.organization_repository import OrganizationRepository
from app.services.base import BaseService
from app.services.subscription_service import SubscriptionServices


class KnowledgeBaseService(BaseService):
    def __init__(self, session: AsyncSession):
        super().__init__(session)
        self.session = session
        self.knowledge_base_repository = KnowledgeBaseRepository(session)
        self.organization_repository = OrganizationRepository(session)
        self.membership_repository = OrganizationMemberRepository(session)
        self.sub_service = SubscriptionServices(session=self.session)
    

    async def create(self, *, organization_id: UUID, current_user: User, name: str, description: str | None ) -> KnowledgeBase:
        await self._require_owner(
            organization_id=organization_id,
            current_user=current_user
        )
        current_kb_count = await self.knowledge_base_repository.count_for_organization(
            organization_id=organization_id
        )
        await self.sub_service.check_quota_limit(
        organization_id=organization_id,
        quota_key="max_knowledge_bases",
        current_count=current_kb_count,
        )

        exisisting = await self.knowledge_base_repository.get_by_name_for_organization(
            organization_id=organization_id,
            knowledge_base_name=name
        )
        if exisisting is not None:
            raise KnowledgeBaseAlreadyExistsException()

        knowledge_base = await self.knowledge_base_repository.create(
            organization_id=organization_id,
            name=name,
            description=description
        )
        await self.session.commit()
        return knowledge_base


    async def list_for_organization(self, *, organization_id: UUID,current_user:User) -> list[KnowledgeBase]:
        await self._require_member(
            organization_id=organization_id,
            current_user=current_user
        )
        return await self.knowledge_base_repository.list_for_organization(
            organization_id=organization_id
        )

    async def get_by_id(self, *, organization_id: UUID, current_user: User, knowledge_base_id: UUID) -> KnowledgeBase:
        await self._require_member(
            organization_id=organization_id,
            current_user=current_user
        )
        from app.redis.cache_services import RedisCacheService
        from app.redis.keys import RedisKeys
        from app.schemas.knowledge_base import KnowledgeBaseResponse

        cache_service = RedisCacheService(self.redis)
        cache_key = RedisKeys.cache_kb(str(knowledge_base_id))

        cached_kb = await cache_service.get_json(key=cache_key, schema_cls=KnowledgeBaseResponse)
        if cached_kb and cached_kb.organization_id == organization_id:
            return KnowledgeBase(
                id=cached_kb.id,
                organization_id=cached_kb.organization_id,
                name=cached_kb.name,
                description=cached_kb.description,
            )

        knowledge_base = await self.knowledge_base_repository.get_by_id_for_organization(
            organization_id=organization_id,
            knowledge_base_id=knowledge_base_id
        )
        if knowledge_base is None:
            raise KnowledgeBaseNotFoundException()

        await cache_service.set_json(
            key=cache_key,
            value=KnowledgeBaseResponse.model_validate(knowledge_base),
            ttl=3600,
        )
        return knowledge_base

    async def update(self, *, organization_id: UUID, knowledge_base_id: UUID, current_user: User, name: str, description: str | None) -> KnowledgeBase:
        await self._require_owner(
            organization_id=organization_id,
            current_user=current_user
        )

        knowledge_base = (
            await self.knowledge_base_repository.get_by_id_for_organization(
            organization_id = organization_id,
            knowledge_base_id=knowledge_base_id,
            )
        )
        if knowledge_base is None:
            raise KnowledgeBaseNotFoundException()

        existing = await self.knowledge_base_repository.get_by_name_for_organization(
            organization_id=organization_id,
            knowledge_base_name=name,
        )

        if existing is not None and existing.id != knowledge_base.id:
            raise KnowledgeBaseAlreadyExistsException()

        knowledge_base.name = name
        knowledge_base.description = description

        await self.session.commit()

        # Evict Knowledge Base Cache
        from app.redis.cache_services import RedisCacheService
        from app.redis.keys import RedisKeys
        await RedisCacheService(self.redis).delete(key=RedisKeys.cache_kb(str(knowledge_base_id)))

        return knowledge_base


        

    async def delete(
            self,
            *,
            organization_id: UUID,
            knowledge_base_id: UUID,
            current_user: User,
        ) -> None:

            await self._require_owner(
                organization_id=organization_id,
                current_user=current_user,
            )

            knowledge_base = (
                await self.knowledge_base_repository.get_by_id_for_organization(
                    organization_id=organization_id,
                    knowledge_base_id=knowledge_base_id,
                )
            )

            if knowledge_base is None:
                raise KnowledgeBaseNotFoundException()

            await self.knowledge_base_repository.delete(knowledge_base)

            await self.session.commit()   

            # Evict Knowledge Base Cache
            from app.redis.cache_services import RedisCacheService
            from app.redis.keys import RedisKeys
            await RedisCacheService(self.redis).delete(key=RedisKeys.cache_kb(str(knowledge_base_id)))

    async def get_knowledge_base(
    self,
    *,
    knowledge_base_id: UUID,
) -> KnowledgeBase:
        from app.redis.cache_services import RedisCacheService
        from app.redis.keys import RedisKeys
        from app.schemas.knowledge_base import KnowledgeBaseResponse

        cache_service = RedisCacheService(self.redis)
        cache_key = RedisKeys.cache_kb(str(knowledge_base_id))

        cached_kb = await cache_service.get_json(key=cache_key, schema_cls=KnowledgeBaseResponse)
        if cached_kb:
            return KnowledgeBase(
                id=cached_kb.id,
                organization_id=cached_kb.organization_id,
                name=cached_kb.name,
                description=cached_kb.description,
            )

        knowledge_base = await self.knowledge_base_repository.get_by_id(
            knowledge_base_id=knowledge_base_id,
        )

        if knowledge_base is None:
            raise KnowledgeBaseNotFoundException()

        await cache_service.set_json(
            key=cache_key,
            value=KnowledgeBaseResponse.model_validate(knowledge_base),
            ttl=3600,
        )
        return knowledge_base

