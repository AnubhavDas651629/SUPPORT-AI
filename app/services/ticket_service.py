from uuid import UUID
from openai import PermissionDeniedError
from sqlalchemy.ext.asyncio import AsyncSession
from app.exceptions.auth import UserNotFoundException
from app.models import conversation
from app.models.organization import Organization
from app.models.organization_member import OrganizationRole
from app.models.ticket import TicketPriority
from app.models.ticket_event import TicketEventType
from app.repositories.ticket_repositories import TicketRepository
from app.services.base import BaseService
from app.services.conversation_services import ConversationService
from app.models.ticket import Ticket
from app.models.ticket import TicketStatus
from app.repositories.user_repository import UserRepository
from app.repositories.organization_member_repository import OrganizationMemberRepository
from app.exceptions.ticket import TicketAlreadyExistsException, TicketNotFoundException
from app.models.message import Message, MessageRole
from app.services.ticket_event_service import TicketEventService

class TicketService(BaseService):
    def __init__(self, *, session: AsyncSession):
        super().__init__(session)

        self.ticket_repository = TicketRepository(session)
        self.conversation_service = ConversationService(session=session)
        self.user_repository = UserRepository(session)
        self.organization_member_repository = OrganizationMemberRepository(session)
        self.ticket_event_service = TicketEventService(session=session)


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

        ticket = await self.ticket_repository.create(
            conversation_id=conversation.id,
            organization_id=conversation.organization_id,
            subject=subject,
            priority=priority,
            created_by_ai=created_by_ai
        )

        await self.ticket_event_service.create_event(
            ticket_id=ticket.id,
            user_id=None,
            event_type=TicketEventType.CREATED,
            description="Ticket created by AI.",
        )
        await self.session.commit()
        return ticket


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

        updated = await self.ticket_repository.update_status(
            ticket=ticket,
            status=status,
        )
        await self.ticket_event_service.create_event(
            ticket_id=ticket.id,
            user_id=None,
            event_type=TicketEventType.STATUS_CHANGED,
            description=f"Status changed to {status.value}.",
        )
        await self.session.commit()
        return updated


    async def update_priority(self,*,ticket_id: UUID,priority: TicketPriority,) -> Ticket:
        ticket = await self.get_ticket(
            ticket_id=ticket_id,
        )

        updated = await self.ticket_repository.update_priority(
            ticket=ticket,
            priority=priority,
        )
        await self.ticket_event_service.create_event(
            ticket_id=ticket.id,
            user_id=None,
            event_type=TicketEventType.PRIORITY_CHANGED,
            description=f"Priority changed to {priority.value}.",
        )
        await self.session.commit()
        return updated


    async def delete_ticket(self,*,ticket_id: UUID,) -> None:
        ticket = await self.get_ticket(
            ticket_id=ticket_id,
        )

        await self.ticket_repository.delete(
            ticket=ticket,
        )
        await self.session.commit()



    async def assign_ticket(self, *, ticket_id: UUID, user_id: UUID) -> Ticket:
        ticket = await self.get_ticket(
            ticket_id=ticket_id
        )

        user = await self.user_repository.get_by_id(
            user_id=user_id
        )

        if user is None:
            raise UserNotFoundException()

        membership = (
            await self.organization_member_repository.get_membership(
                organization_id=ticket.organization_id,
                user_id=user.id
            )
        )

        if membership is None:
            raise PermissionDeniedError()

        if membership.role != OrganizationRole.SUPPORT:
            raise PermissionDeniedError()

        ticket =  await self.ticket_repository.assign(
            ticket=ticket,
            user=user
        )

        await self.ticket_event_service.create_event(
            ticket_id=ticket.id,
            user_id=user.id,
            event_type=TicketEventType.ASSIGNED,
            description=f"Assigned to {user.full_name}.",
        )

        return ticket


    async def reply_to_ticket(self, *, ticket_id:UUID, content:str) -> Message:
        ticket = await self.get_ticket(
            ticket_id=ticket_id
        ) 

        message = await self.conversation_service.create_conversation(
            conversation_id = ticket.conversation_id,
            role = MessageRole.SUPPORT,
            content = content
        )
        await self.ticket_event_service.create_event(
            ticket_id=ticket.id,
            user_id=ticket.assigned_to_user_id,
            event_type=TicketEventType.REPLIED,
            description="Support agent replied.",
        )
        return message

    
