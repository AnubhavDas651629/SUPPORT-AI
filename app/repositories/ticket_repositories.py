import select
from uuid import UUID
from httpx import delete
from sqlalchemy import select
from app.models.ticket import Ticket, TicketPriority, TicketStatus
from app.repositories.base import BaseRepository
from app.models.user import User

class TicketRepository(BaseRepository):
    async def create(self, *, conversation_id:UUID, organization_id: UUID, subject: str, priority: TicketPriority = TicketPriority.MEDIUM, created_by_ai: bool = True) -> Ticket:
        ticket = Ticket(
            conversation_id = conversation_id,
            organization_id = organization_id,
            subject = subject,
            priority=priority,
            created_by_ai=created_by_ai
        )
        self.session.add(ticket)
        await self.session.flush()
        return ticket


    async def get_by_id(self, *, ticket_id: UUID) -> Ticket | None:
        query = (
            select(Ticket)
            .where(
                Ticket.id == ticket_id
            )
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_conversation(self, *, conversation_id:UUID) -> Ticket | None:
        query = (
            select(Ticket)
            .where(
                Ticket.conversation_id == conversation_id
            )
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def list_for_organization(self, *, organization_id: UUID, limit: int = 20, offset: int = 0) -> list[Ticket]:
        query = (
            select(Ticket)
            .where(
                Ticket.organization_id == organization_id
            )
            .order_by(
                Ticket.created_at.desc()
            )
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())


    async def update_status(self, *, ticket: Ticket, status: TicketStatus) -> Ticket:
        ticket.status = status
        await self.session.flush()
        await self.session.refresh(ticket)
        return ticket


    async def update_priority(self, *, ticket: Ticket, priority: TicketPriority) -> Ticket:
        ticket.priority = priority
        await self.session.flush()
        await self.session.refresh(ticket)
        return ticket

    async def delete(self, *, ticket: Ticket) -> None:
        await self.session.delete(ticket)
        await self.session.flush()



    async def assign(self, *, ticket: Ticket, user: User) -> Ticket:
        ticket.assigned_to = user
        await self.session.flush()
        return ticket

        
