from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime


class CreateTicketNoteRequest(BaseModel):
    author_id: UUID
    content: str


class TicketNoteResponse(BaseModel):
    id: UUID
    author_id: UUID
    content: str
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )