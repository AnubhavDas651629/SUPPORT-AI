from uuid import UUID
import uuid
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128, description="Password must be at least 8 characters")
    full_name: str = Field(..., min_length=1, max_length=100, description="Full name cannot be blank")

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Full name cannot be empty or whitespace only.")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v.strip()) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        return v

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes = True)
    id: UUID
    email: EmailStr
    full_name: str
    is_active: bool
    is_verified: bool
    