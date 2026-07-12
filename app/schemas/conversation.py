from datetime import datetime
from email import message
from mailbox import Message
from turtle import title
from uuid import UUID

from pydantic import BaseModel
from app.models import conversation, knowledge_base
from app.models.message import MessageRole


class ConversationResponse(BaseModel):
    id: UUID
    organization_id: UUID
    knowledge_base_id: UUID
    title: str | None
    created_at: datetime
    updated_at: datetime

class MessageCreate(BaseModel):
    content: str

class MessageResponse(BaseModel):
    id: UUID
    conversation_id: UUID
    role: MessageRole
    content: str
    created_at: datetime

class ConversationDetailResponse(BaseModel):
    id: UUID
    title: str | None
    messages: list[MessageResponse]

class ConversationSummaryResponse(BaseModel):
    id:UUID
    title: str | None
    updated_at: datetime

class ConversationDetailResponse(BaseModel):
    id: UUID
    title: str | None
    messages: list[MessageResponse]