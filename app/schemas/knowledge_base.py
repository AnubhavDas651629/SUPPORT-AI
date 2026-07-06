from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models import organization

class KnowledgeBaseCreate(BaseModel):
    name: str = Field(min_length=1)
    description: str | None = None

class KnowledgeBaseUpdate(BaseModel):
    name:str 
    description: str | None = None

class KnowledgeBaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    name: str
    description: str | None

class KnowledgeBaseListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: str | None