from uuid import UUID
from fastapi import Depends, Header, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.dependencies import get_db
from app.exceptions.api_key import InvalidApiKeyException
from app.models.organization import Organization
from app.repositories.api_key_repository import ApiKeyRepository
from app.repositories.organization_repository import OrganizationRepository
from app.utils.api_key import hash_api_key

async def get_widget_organization(
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
    api_key: str | None = Query(default=None, alias="api_key"),
    session: AsyncSession = Depends(get_db),
) -> Organization:
    """
    sole purpose is to verify if api key provided by user belongs to org or not
    Authenticate widget requests via Public API Key (X-API-Key header or ?api_key= query parameter).
    """
    key_str = x_api_key or api_key
    if not key_str:
        raise InvalidApiKeyException()
    key_hash = hash_api_key(key_str)
    api_key_repo = ApiKeyRepository(session)
    api_key_obj = await api_key_repo.get_by_hash(key_hash=key_hash)
    if not api_key_obj:
        raise InvalidApiKeyException()
    org_repo = OrganizationRepository(session)
    org = await org_repo.get_by_id(organization_id=api_key_obj.organization_id)
    if not org:
        raise InvalidApiKeyException()
    return org