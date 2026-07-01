from uuid import UUID
import uuid
from pydantic import BaseModel, ConfigDict, EmailStr
from sqlalchemy.sql.operators import from_

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes = True)
    id: UUID
    email: EmailStr
    full_name: str
    is_active: bool
    is_verified: bool
    