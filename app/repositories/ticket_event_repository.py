import select
from uuid import UUID

from sqlalchemy import select
from app.models.ticket import Ticket
from app.models.ticket_event import TicketEvent, TicketEventType
from app.repositories.base import BaseRepository


class TicketEventRepository(BaseRepository):
    async def create(self, *,ticket_id: UUID, user_id:UUID, event_type: TicketEventType, description: str) -> TicketEvent:
        ticket_event = TicketEvent(
            ticket_id = ticket_id,
            user_id = user_id,
            event_type = event_type,
            description = description
        )

        self.session.add(ticket_event)
        await self.session.flush()
        return ticket_event


    async def list_for_ticket(self, *, ticket_id: UUID) -> list[TicketEvent]:
        query = (
            select(TicketEvent)
            .where(
                TicketEvent.ticket_id == ticket_id
            )
            .order_by(
                TicketEvent.created_at.desc()
            )
        )
        result = await self.session.execute(query)

        return list(result.scalars().all())
