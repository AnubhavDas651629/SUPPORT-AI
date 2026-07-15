from datetime import datetime
from uuid import UUID
from pydantic import ConfigDict, BaseModel

from app.models.ticket_event import TicketEventType


class TicketEventResponse(BaseModel):
    id: UUID
    event_type: TicketEventType
    description: str
    user_id: UUID | None
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )