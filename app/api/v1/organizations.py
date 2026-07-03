from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.dependencies import get_db
from app.dependencies.auth import get_current_user
from app.models import organization
from app.models.user import User
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationResponse,
)
from app.services.organization_service import (
    OrganizationService,
)
from migrations.versions.e28f3806fcc1_add_phone_number_to_users import depends_on

router = APIRouter(
    prefix="/organizations",
    tags=["Organizations"],
)

@router.post("",response_model=OrganizationResponse, status_code=201)
async def create_organization(
    organization: OrganizationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = OrganizationService(db)

    created = await service.create(
        current_user=current_user,
        name=organization.name,
    )
    return OrganizationResponse.model_validate(created)

@router.get("", response_model=list[OrganizationResponse],)
async def list_organizations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    service = OrganizationService(db)

    organizations = await service.list_organizations(
        current_user=current_user,
    )

    return [
        OrganizationResponse.model_validate(org)
        for org in organizations
    ]

@router.get("/{organization_id}",response_model=OrganizationResponse)
async def get_organization(
    organization_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    service = OrganizationService(db)

    organization = await service.get_organization(
        organization_id=organization_id,
        current_user=current_user,
    )

    return OrganizationResponse.model_validate(
        organization
    )