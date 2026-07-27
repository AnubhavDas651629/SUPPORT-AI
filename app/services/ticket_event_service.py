from uuid import UUID
from app.models.ticket_event import TicketEvent, TicketEventType
from app.models.user import User
from app.repositories.ticket_event_repository import TicketEventRepository
from app.repositories.ticket_repositories import TicketRepository
from app.services.base import BaseService
from app.exceptions.ticket import TicketNotFoundException
from sqlalchemy.ext.asyncio import AsyncSession

class TicketEventService(BaseService):
    def __init__(self, session: AsyncSession):
        super().__init__(session)

        self.ticket_event_repository = TicketEventRepository(session=session)
        self.ticket_repository = TicketRepository(session=session)

    async def create_event(self, *,ticket_id: UUID, user_id: UUID | None,  event_type: TicketEventType, description: str) -> TicketEvent:
        event = await self.ticket_event_repository.create(
            ticket_id=ticket_id,
            user_id=user_id,
            event_type= event_type,
            description=description
        )
        return event
        

    async def list_events(self, *, ticket_id: UUID, current_user: User | None = None):
        ticket = await self.ticket_repository.get_by_id(
            ticket_id=ticket_id,
        )
        if ticket is None:
            raise TicketNotFoundException()

        if current_user is not None:
            await self._require_member(
                organization_id=ticket.organization_id,
                current_user=current_user,
            )

        return await self.ticket_event_repository.list_for_ticket(
            ticket_id=ticket_id
        )
        
