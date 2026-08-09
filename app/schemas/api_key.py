from datetime import datetime
from uuid import UUID
from pydantic import BaseModel

class ApiKeyCreateRequest(BaseModel):
    """
    Owner sends this to create a new api key
    """
    name: str
    expires_at: datetime | None = None

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

    