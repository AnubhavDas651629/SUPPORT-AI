from app.utils.cursor import encode_cursor
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.exceptions.auth import PermissionDeniedException, UserNotFoundException
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
from app.models.user import User
from app.services.ticket_event_service import TicketEventService
from app.workers.tasks import send_ticket_create_email, dispatch_webhook_event_task
from app.core.webhook_events import WebhookEventType

class TicketService(BaseService):
    def __init__(self, *, session: AsyncSession):
        super().__init__(session)

        self.ticket_repository = TicketRepository(session)
        self.conversation_service = ConversationService(session=session)
        self.user_repository = UserRepository(session)
        self.organization_member_repository = OrganizationMemberRepository(session)
        self.ticket_event_service = TicketEventService(session=session)


    async def create_ticket(self, *, conversation_id: UUID, priority: TicketPriority = TicketPriority.MEDIUM, created_by_ai: bool = True, current_user: User | None = None) -> Ticket:
        conversation = await self.conversation_service.get_conversation(
            conversation_id=conversation_id,
            current_user=current_user,
        )
        existing_ticket = await self.ticket_repository.get_by_conversation(
            conversation_id=conversation_id
        )
        if existing_ticket is not None:
            raise TicketAlreadyExistsException()

        subject = conversation.title or "Untitled Conversation"

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

        send_ticket_create_email.delay(
            str(ticket.id)
        )
        await self.session.commit()
        await self.session.refresh(ticket)
        return ticket


    async def get_ticket(self, *, ticket_id: UUID, current_user: User | None = None) -> Ticket:
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

        return ticket

    async def list_tickets(self, *, organization_id: UUID, current_user: User, limit: int = 20, offset: int = 0) -> list[Ticket]:
        await self._require_member(
            organization_id=organization_id,
            current_user=current_user,
        )
        return await self.ticket_repository.list_for_organization(
            organization_id=organization_id,
            limit=limit,
            offset=offset,
        )

    async def list_tickets_paginated(
        self,
        *,
        organization_id: UUID,
        current_user: User,
        status: TicketStatus | None = None,
        priority: TicketPriority | None = None,
        search: str | None = None,
        cursor: str | None = None,
        limit: int = 20,
    ) -> tuple[list[Ticket], str | None, bool]:
        await self._require_member(
            organization_id=organization_id,
            current_user=current_user,
        )
        tickets, has_more = await self.ticket_repository.list_for_organization_paginated(
            organization_id=organization_id,
            status=status,
            priority=priority,
            search=search,
            cursor=cursor,
            limit=limit,
        )

        next_cursor = None
        if has_more and tickets:
            last_ticket = tickets[-1]
            next_cursor = encode_cursor(last_ticket.created_at, last_ticket.id)

        return tickets, next_cursor, has_more


    async def update_status(self, *, ticket_id: UUID, status: TicketStatus, current_user: User) -> Ticket:
        ticket = await self.get_ticket(
            ticket_id=ticket_id,
            current_user=current_user,
        )

        updated = await self.ticket_repository.update_status(
            ticket=ticket,
            status=status,
        )
        await self.ticket_event_service.create_event(
            ticket_id=ticket.id,
            user_id=current_user.id if current_user else None,
            event_type=TicketEventType.STATUS_CHANGED,
            description=f"Status changed to {status.value}.",
        )
        await self.session.commit()
        await self.session.refresh(updated)
        return updated


    async def update_priority(self, *, ticket_id: UUID, priority: TicketPriority, current_user: User) -> Ticket:
        ticket = await self.get_ticket(
            ticket_id=ticket_id,
            current_user=current_user,
        )

        updated = await self.ticket_repository.update_priority(
            ticket=ticket,
            priority=priority,
        )
        await self.ticket_event_service.create_event(
            ticket_id=ticket.id,
            user_id=current_user.id if current_user else None,
            event_type=TicketEventType.PRIORITY_CHANGED,
            description=f"Priority changed to {priority.value}.",
        )
        await self.session.commit()
        await self.session.refresh(updated)
        return updated


    async def delete_ticket(self, *, ticket_id: UUID, current_user: User) -> None:
        ticket = await self.get_ticket(
            ticket_id=ticket_id,
            current_user=current_user,
        )

        await self.ticket_repository.delete(
            ticket=ticket,
        )
        await self.session.commit()



    async def assign_ticket(self, *, ticket_id: UUID, user_id: UUID, current_user: User) -> Ticket:
        ticket = await self.get_ticket(
            ticket_id=ticket_id,
            current_user=current_user,
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
            raise PermissionDeniedException()

        if membership.role != OrganizationRole.SUPPORT:
            raise PermissionDeniedException()

        ticket =  await self.ticket_repository.assign(
            ticket=ticket,
            user=user
        )

        await self.ticket_event_service.create_event(
            ticket_id=ticket.id,
            user_id=current_user.id if current_user else user.id,
            event_type=TicketEventType.ASSIGNED,
            description=f"Assigned to {user.full_name}.",
        )

        await self.session.commit()
        await self.session.refresh(ticket)
        return ticket


    async def reply_to_ticket(self, *, ticket_id: UUID, content: str, current_user: User) -> Message:
        ticket = await self.get_ticket(
            ticket_id=ticket_id,
            current_user=current_user,
        ) 

        message = await self.conversation_service.create_message(
            conversation_id = ticket.conversation_id,
            role = MessageRole.SUPPORT,
            content = content
        )
        await self.ticket_event_service.create_event(
            ticket_id=ticket.id,
            user_id=current_user.id if current_user else ticket.assigned_to_user_id,
            event_type=TicketEventType.REPLIED,
            description="Support agent replied.",
        )
        await self.session.commit()
        await self.session.refresh(message)
        return message

    
