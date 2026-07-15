from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.dependencies import get_db
from app.schemas.ticket_event import TicketEventResponse
from app.services.ticket_event_service import TicketEventService


router = APIRouter(
    prefix="/tickets",
    tags=["Ticket Events"],
)

@router.get("/{ticket_id}/events", response_model=list[TicketEventResponse])
async def list_events(
    ticket_id: UUID,
    session: AsyncSession = Depends(get_db)
):
    service = TicketEventService(session=session)

    events = await service.list_events(
        ticket_id=ticket_id
    )

    return [
        TicketEventResponse.model_validate(event)
        for event in events
    ]
    