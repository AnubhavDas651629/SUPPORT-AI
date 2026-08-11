from datetime import datetime, UTC
from uuid import UUID
from pydantic import BaseModel, Field, field_validator

class ApiKeyCreateRequest(BaseModel):
    """
    Owner sends this to create a new api key
    """
    name: str = Field(..., min_length=1, max_length=100)
    expires_at: datetime | None = None

    @field_validator("expires_at")
    @classmethod
    def validate_expires_at(cls, v: datetime | None) -> datetime | None:
        if v is not None:
            now = datetime.now(UTC)
            v_utc = v if v.tzinfo else v.replace(tzinfo=UTC)
            if v_utc <= now:
                raise ValueError("Expiration date must be in the future.")
        return v

class ApiKeyCreatedResponse(BaseModel):
    """
    Returned ONCE after creation
    contains raw seceret key, will never show this
    frontend will show display: copy this key now, it won't be shown again
    """
    id: UUID
    name: str
    key_prefix: str
    secret_key: str 
    created_at: datetime
    model_config = {"from_attributes": True}

class ApiKeyResponse(BaseModel):
    """
    Safe response for list & revoke routes.
    Never exposes key_hash or the raw secret.
    """
    id: UUID
    name: str
    key_prefix: str   # e.g. "sk_live_a8f9...3b1a"
    is_active: bool
    last_used_at: datetime | None = None
    expires_at: datetime | None = None
    created_at: datetime
    model_config = {"from_attributes": True}

    