from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import conversation
from app.models.ticket import TicketPriority
from app.repositories.ticket_repositories import TicketRepository
from app.services.base import BaseService
from app.services.conversation_services import ConversationService
from app.models.ticket import Ticket
from app.models.ticket import TicketStatus

class TicketService(BaseService):
    def __init__(self, * session: AsyncSession):
        super().__init__(session)

        self.ticket_repository = TicketRepository(session)
        self.conversation_service = ConversationService(session=session)

    async def create_ticket(self, *, conversation_id: UUID, priority: TicketPriority = TicketPriority.MEDIUM,created_by_ai: bool = True) -> Ticket:
        conversation = await self.conversation_service.get_conversation(
            conversation_id=conversation_id,
        )
        existing_ticket = await self.ticket_repository.get_by_conversation(
            conversation_id=conversation_id
        )
        if existing_ticket is not None:
            raise TicketAlreadyExistsException()

        subject = conversation.title or "Untitle Conversation"

        return await self.ticket_repository.create(
            conversation_id=conversation.id,
            organization_id=conversation.organization_id,
            subject=subject,
            priority=priority,
            created_by_ai=created_by_ai
        )


    async def get_ticket(self, *, ticket_id: UUID) -> Ticket:
        ticket = await self.ticket_repository.get_by_id(
            ticket_id=ticket_id,
        )
        if ticket is None:
            raise TicketNotFoundException()
        return ticket

    async def list_tickets(self,*,organization_id: UUID,limit: int = 20,offset: int = 0) -> list[Ticket]:
        return await self.ticket_repository.list_for_organization(
            organization_id=organization_id,
            limit=limit,
            offset=offset,
        )

    async def update_status(self,*,ticket_id: UUID,status: TicketStatus) -> Ticket:
        ticket = await self.get_ticket(
            ticket_id=ticket_id,
        )

        return await self.ticket_repository.update_status(
            ticket=ticket,
            status=status,
        )


    async def update_priority(self,*,ticket_id: UUID,priority: TicketPriority,) -> Ticket:
        ticket = await self.get_ticket(
            ticket_id=ticket_id,
        )

        return await self.ticket_repository.update_priority(
            ticket=ticket,
            priority=priority,
        )