from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.organization_member import OrganizationRole

class MemberInviteRequest(BaseModel):
    email: EmailStr
    role: OrganizationRole

class MemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: UUID
    organization_id: UUID
    role:OrganizationRole