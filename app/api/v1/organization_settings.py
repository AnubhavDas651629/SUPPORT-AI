from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.dependencies import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.organization_settings import (
    OrganizationSettingsResponse,
    OrganizationSettingsUpdateRequest,
)
from app.services.organization_settings_service import OrganizationSettingsService
router = APIRouter(
    prefix="/organizations/{organization_id}/settings",
    tags=["Organization Settings"]
)


@router.get("", response_model=OrganizationSettingsResponse)
async def get_settings(
    organization_id: UUID,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns current organization settings. Accessible by any member."""
    service = OrganizationSettingsService(session=session)
    return await service.get_settings(
        organization_id=organization_id,
        current_user=current_user,
    )

@router.patch("", response_model=OrganizationSettingsResponse)
async def update_settings(
    organization_id: UUID,
    body: OrganizationSettingsUpdateRequest,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Partially updates organization settings. Owner-only.
    Branding fields (color, logo, widget title) require Pro/Enterprise plan.
    """
    service = OrganizationSettingsService(session=session)
    # model_dump(exclude_none=True) only gives us fields the owner actually sent
    update_data = body.model_dump(exclude_none=True)
    return await service.update_settings(
        organization_id=organization_id,
        current_user=current_user,
        update_data=update_data,
    )

