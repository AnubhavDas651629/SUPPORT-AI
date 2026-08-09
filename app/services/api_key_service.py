from datetime import datetime
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.api_key import ApiKey
from app.models.user import User
from app.repositories.api_key_repository import ApiKeyRepository
from app.services.base import BaseService
from app.services.subscription_service import SubscriptionServices
from app.utils.api_key import generate_api_key
from app.exceptions.auth import PermissionDeniedException


class ApiKeyService(BaseService):
    def __init__(self, session: AsyncSession):
        super().__init__(session)
        self.api_key_repository = ApiKeyRepository(session)
        self.subscription_service = SubscriptionServices(session)

    async def create_api_key(
        self, 
        *, 
        organization_id:UUID,
        current_user: User,
        name:str,
        expires_at: datetime | None = None
    ) -> tuple[ApiKey, str]:
        """
        Creates a new API key for the organization
        return (ApiKey, raw_secret) -> raw secret is returned only here, never stored
        Gated behind: OWNER role + allows_api_keys plan flag
        """
        await self._require_owner(
            organization_id=organization_id,
            current_user=current_user
        )


        #plan gate: free tier cannot create API key
        await self.subscription_service.check_feature_allowed(
            Organization_id=organization_id,
            feature_flag="allows_api_keys",
            current_user=current_user
        )
        raw_key, key_hash, key_prefix = generate_api_key()

        api_key = await self.api_key_repository.create(
            organization_id=organization_id,
            name=name,
            key_prefix=key_prefix,
            key_hash=key_hash,
            expires_at=expires_at
        )
        await self.session.commit()
        #return both the DB record and the raw key
        #the raw key is passed to the route handler which puts it in ApiKeyCreatedResponse
        return api_key, raw_key

    async def list_api_keys(self, *, organization_id: UUID, current_user: User) -> list[ApiKey]:
        """
        Any member can see the lsit of keys (but never the raw secret or hash)
        """
        await self._require_member(
            organization_id=organization_id,
            current_user=current_user
        )
        return await self.api_key_repository.list_for_organization(
            organization_id=organization_id
        )

    async def revoke_api_key(
        self,
        *,
        organization_id: UUID,
        api_key_id: UUID,
        current_user: User) -> ApiKey:

        await self._require_owner(
            organization_id=organization_id,
            current_user=current_user,
        )
        api_key = await self.api_key_repository.get_by_id(
            api_key_id=api_key_id,
            organization_id=organization_id,
        )
        if api_key is None:
            raise PermissionDeniedException()
        revoked = await self.api_key_repository.revoke(api_key=api_key)
        await self.session.commit()
        return revoked


