from uuid import UUID
from app.models.ticket_event import TicketEvent, TicketEventType
from app.repositories.ticket_event_repository import TicketEventRepository
from app.services.base import BaseService
from sqlalchemy.ext.asyncio import AsyncSession

class TicketEventService(BaseService):
    def __init__(self, session: AsyncSession):
        super().__init__(session)

        self.ticket_event_repository = TicketEventRepository(session=session)

    async def create_event(self, *,ticket_id: UUID, user_id: UUID | None,  event_type: TicketEventType, description: str) -> TicketEvent:
        event = await self.ticket_event_repository.create(
            ticket_id=ticket_id,
            user_id=user_id,
            event_type= event_type,
            description=description
        )
        return event
        

    async def list_events(self, *, ticket_id: UUID):
        return await self.ticket_event_repository.list_for_ticket(
            ticket_id=ticket_id
        )
        
