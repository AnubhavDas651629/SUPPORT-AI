from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.dependencies import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.api_key import (
    ApiKeyCreateRequest,
    ApiKeyCreatedResponse,
    ApiKeyResponse,
)
from app.services.api_key_service import ApiKeyService

router = APIRouter(
    prefix="/organizations/{organization_id}/api-keys",
    tags=["API Keys"],
)


@router.post("", response_model=ApiKeyCreatedResponse, status_code=201)
async def create_api_key(
    organization_id: UUID,
    body: ApiKeyCreateRequest,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Creates a new API key. Owner-only. Requires Pro/Enterprise plan.
    The raw secret key is returned ONCE in this response — it cannot be retrieved again.
    """
    service = ApiKeyService(session=session)
    api_key, raw_key = await service.create_api_key(
        organization_id=organization_id,
        current_user=current_user,
        name=body.name,
        expires_at=body.expires_at,
    )
    return ApiKeyCreatedResponse(
        id=api_key.id,
        name=api_key.name,
        key_prefix=api_key.key_prefix,
        secret_key=raw_key,   # ← The only time the raw key ever leaves the server
        created_at=api_key.created_at,
    )


@router.get("", response_model=list[ApiKeyResponse])
async def list_api_keys(
    organization_id: UUID,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all API keys for this organization. Any member can view."""
    service = ApiKeyService(session=session)
    return await service.list_api_keys(
        organization_id=organization_id,
        current_user=current_user,
    )


@router.delete("/{api_key_id}", response_model=ApiKeyResponse)
async def revoke_api_key(
    organization_id: UUID,
    api_key_id: UUID,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Revokes a specific API key. Owner-only."""
    service = ApiKeyService(session=session)
    return await service.revoke_api_key(
        organization_id=organization_id,
        api_key_id=api_key_id,
        current_user=current_user,
    )
