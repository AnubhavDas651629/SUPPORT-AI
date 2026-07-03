from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.dependencies import get_db
from app.dependencies.auth import get_current_user
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