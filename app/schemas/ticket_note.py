from typing import Any
from pydantic import BaseModel, ConfigDict, computed_field
from uuid import UUID
from datetime import datetime


class CreateTicketNoteRequest(BaseModel):
    content: str


class TicketNoteResponse(BaseModel):
    id: UUID
    author_id: UUID
    content: str
    created_at: datetime
    author: Any = None # To hold the author relationship

    @computed_field
    def author_name(self) -> str:
        if self.author:
            return getattr(self.author, "full_name", "Unknown")
        return "Unknown"

    model_config = ConfigDict(
        from_attributes=True
    )