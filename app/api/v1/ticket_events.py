from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.dependencies import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.ticket_event import TicketEventResponse
from app.services.ticket_event_service import TicketEventService


router = APIRouter(
    prefix="/tickets",
    tags=["Ticket Events"],
)

@router.get("/{ticket_id}/events", response_model=list[TicketEventResponse])
async def list_events(
    ticket_id: UUID,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = TicketEventService(session=session)

    events = await service.list_events(
        ticket_id=ticket_id,
        current_user=current_user,
    )

    return [
        TicketEventResponse.model_validate(event)
        for event in events
    ]
    