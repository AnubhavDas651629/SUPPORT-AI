from uuid import UUID
from pydantic import BaseModel, EmailStr, Field


class OrganizationSettingsResponse(BaseModel):
    id: UUID
    organization_id: UUID
    company_logo_url: str | None = None
    primary_color: str
    widget_title: str
    system_prompt_override: str | None = None
    temperature: float
    support_email: str | None = None
    auto_create_ticket_on_escalation: bool

    model_config = {"from_attributes": True}


class OrganizationSettingsUpdateRequest(BaseModel):
    """
    Every field is optional (defaults to None) because PATCH 
    only updates the fields provided by the owner.
    """
    company_logo_url: str | None = None
    # Validates standard 6-character hex colors like #4F46E5 or #FFFFFF
    primary_color: str | None = Field(default=None, pattern=r"^#[0-9A-Fa-f]{6}$")
    widget_title: str | None = None
    system_prompt_override: str | None = None
    # Temperature must be between 0.0 and 1.0
    temperature: float | None = Field(default=None, ge=0.0, le=1.0)
    support_email: EmailStr | None = None
    auto_create_ticket_on_escalation: bool | None = None
