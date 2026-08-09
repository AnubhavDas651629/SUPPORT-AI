from datetime import datetime, UTC
from uuid import UUID
from sqlalchemy import select
from app.models.api_key import ApiKey
from app.repositories.base import BaseRepository


class ApiKeyRepository(BaseRepository):
    async def get_by_id(self, *, api_key_id:UUID, organization_id:UUID) -> ApiKey | None:
        """Fetch specific key belonging to this org"""
        stmt = (
            select(ApiKey)
            .where(
                ApiKey.id  == api_key_id,
                ApiKey.organization_id == organization_id
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()


    async def get_by_hash(self, *, key_hash: str) -> ApiKey | None:
        """
        Called on every API request that uses X-API-Key authentication.
        Indexed on key_hash for O(1) lookup speed.
        """
        stmt = select(ApiKey).where(
            ApiKey.key_hash == key_hash,
            ApiKey.is_active == True,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()


    async def list_for_organization(self, *, organization_id: UUID) -> list[ApiKey]:
        """List all API keys for this org (never exposes hash or raw key)"""
        stmt = (
            select(ApiKey)
            .where(ApiKey.organization_id == organization_id)
            .order_by(ApiKey.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create(
        self,
        *,
        organization_id: UUID,
        name: str,
        key_prefix: str,
        key_hash: str,
        expires_at: datetime | None = None,
    ) -> ApiKey:
        api_key = ApiKey(
            organization_id=organization_id,
            name=name,
            key_prefix=key_prefix,
            key_hash=key_hash,
            is_active=True,
            expires_at=expires_at,
        )
        self.session.add(api_key)
        await self.session.flush()
        return api_key


    async def revoke(self, *, api_key: ApiKey) -> ApiKey:
        """Instantly revoke a key by setting is_active = False."""
        api_key.is_active = False
        await self.session.flush()
        return api_key
        
    async def touch_last_used(self, *, api_key: ApiKey) -> None:
        """Update last_used_at timestamp every time this key is used."""
        api_key.last_used_at = datetime.now(UTC)
        await self.session.flush()
        
