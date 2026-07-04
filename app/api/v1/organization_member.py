import email
from uuid import UUID

from fastapi import Depends, APIRouter, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.functions import current_user

from app.db.dependencies import get_db
from app.dependencies.auth import get_current_user
from app.models import organization
from app.models.organization_member import OrganizationMember, OrganizationRole
from app.models.user import User
from app.schemas.member import (MemberInviteRequest, MemberResponse, OrganizationMemberResponse, UpdateMemberRoleRequest)
from app.services.organization_service import OrganizationService
from migrations.versions.e28f3806fcc1_add_phone_number_to_users import depends_on

router = APIRouter(
    prefix="/organizations/{organization_id}/members",
    tags=["Organization Members"],
)

#POST /organizations/{organization_id}/members
#Add (invite) a new member to this organization.
@router.post("", response_model=MemberResponse, status_code=201)
async def invite_member(
    request: MemberInviteRequest,
    organization_id: UUID,
    db : AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = OrganizationService(db)

    invited = await service.invite_member(
        organization_id=organization_id,
        email=request.email,
        role=request.role,
        current_user=current_user,
    )
    return MemberResponse.model_validate(invited)

#lists all the membres of a organization
@router.get("", response_model=list[OrganizationMemberResponse])
async def list_members(
    organization_id: UUID, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service  = OrganizationService(db)

    return await service.list_members(
        organization_id=organization_id,
        current_user=current_user
    )

# to update the roll of member, user_id is the id of the target
@router.patch("/{user_id}", response_model=MemberResponse)
async def update_member_role(
    organization_id:UUID, 
    user_id:UUID,
    request:UpdateMemberRoleRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    service = OrganizationService(db)

    membership = await service.update_member_role(
        organization_id=organization_id,
        target_user_id=user_id,
        current_user=current_user,
        role=request.role,
    )
    return MemberResponse.model_validate(membership)
    
@router.delete("/{user_id}", status_code=204)
async def remove_member(
    organization_id:UUID,
    user_id:UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    service = OrganizationService(db)

    deleted = await service.remove_member(
        organization_id=organization_id,
        current_user=current_user,
        target_user_id=user_id
    )

