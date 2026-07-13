from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from app.models.message import MessageRole


class ConversationResponse(BaseModel):
    id: UUID
    organization_id: UUID
    knowledge_base_id: UUID
    title: str | None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(
        from_attributes=True
    )


class MessageCreate(BaseModel):
    content: str


class MessageResponse(BaseModel):
    id: UUID
    conversation_id: UUID
    role: MessageRole
    content: str
    created_at: datetime
    model_config = ConfigDict(
        from_attributes=True
    )


class ConversationDetailResponse(BaseModel):
    id: UUID
    title: str | None
    messages: list[MessageResponse]
    model_config = ConfigDict(
        from_attributes=True
    )


class ConversationSummaryResponse(BaseModel):
    id: UUID
    title: str | None
    updated_at: datetime
    model_config = ConfigDict(
        from_attributes=True
    )