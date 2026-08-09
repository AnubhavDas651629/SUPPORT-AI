from uuid import UUID
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
import re


def is_valid_hex_color(value: str) -> str:
    """Validates that a string is a valid hex color like #4F46E5."""
    if not re.match(r'^#[0-9A-Fa-f]{6}$', value):
        raise ValueError("primary_color must be a valid hex color e.g. #4F46E5")
    return value


class OrganizationSettingsResponse(BaseModel):
    id: UUID
    organization_id: UUID
    company_logo_url: Optional[str] = None
    primary_color: str
    widget_title: str
    system_prompt_override: Optional[str] = None
    temperature: float
    support_email: Optional[str] = None
    auto_create_ticket_on_escalation: bool

    model_config = {"from_attributes": True}


class OrganizationSettingsUpdateRequest(BaseModel):
    """
    Every field is Optional because PATCH updates only the fields the owner sends.
    If a field is None/absent, we leave it unchanged.
    """
    company_logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    widget_title: Optional[str] = None
    system_prompt_override: Optional[str] = None
    # temperature must be between 0 and 1 (OpenAI rejects values outside this)
    temperature: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    support_email: Optional[EmailStr] = None
    auto_create_ticket_on_escalation: Optional[bool] = None
