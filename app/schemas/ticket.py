from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.ticket import TicketPriority, TicketStatus


class CreateTicketRequest(BaseModel):
    conversation_id: UUID
    priority: TicketPriority = TicketPriority.MEDIUM

class TicketResponse(BaseModel):
    id: UUID
    conversation_id: UUID
    organization_id: UUID
    subject: str
    status: TicketStatus
    priority: TicketPriority
    created_by_ai: bool
    created_at: datetime
    updated_at: datetime
    assigned_to_user: UUID | None
    model_config = ConfigDict(
        from_attributes=True
    )

class UpdateTicketStatusRequest(BaseModel):
    status: TicketStatus

class UpdateTicketPriorityRequest(BaseModel):
    priority: TicketPriority


class AssignTicketRequest(BaseModel):
    user_id: UUID
