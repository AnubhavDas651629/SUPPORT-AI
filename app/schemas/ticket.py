from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.ticket import TicketPriority, TicketStatus


class CreateTicketRequest(BaseModel):
    conversation_id: UUID
    priority: TicketPriority = TicketPriority.MEDIUM

from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, ConfigDict, computed_field

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
    assigned_to_user_id: UUID | None

    @computed_field
    def sla_deadline(self) -> str:
        if self.status in [TicketStatus.RESOLVED, TicketStatus.CLOSED]:
            return "Resolved"
            
        sla_hours = {
            TicketPriority.URGENT: 1,
            TicketPriority.HIGH: 4,
            TicketPriority.MEDIUM: 24,
            TicketPriority.LOW: 48,
        }.get(self.priority, 24)

        # Make sure created_at is timezone-aware
        created = self.created_at
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
            
        deadline = created + timedelta(hours=sla_hours)
        now = datetime.now(timezone.utc)
        
        if now > deadline:
            return "Breached"
            
        diff = deadline - now
        hours = int(diff.total_seconds() // 3600)
        mins = int((diff.total_seconds() % 3600) // 60)
        
        if hours > 0:
            return f"{hours} hrs left"
        return f"{mins} mins left"

    model_config = ConfigDict(
        from_attributes=True
    )

class UpdateTicketStatusRequest(BaseModel):
    status: TicketStatus

class UpdateTicketPriorityRequest(BaseModel):
    priority: TicketPriority


class AssignTicketRequest(BaseModel):
    user_id: UUID
