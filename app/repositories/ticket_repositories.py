from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.ticket import Ticket, TicketPriority, TicketStatus
from app.models.user import User
from app.repositories.base import BaseRepository

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
        await self.session.refresh(ticket)
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

    async def list_for_organization(self, *, organization_id: UUID, status: TicketStatus | None = None,limit: int = 20, offset: int = 0) -> list[Ticket]:
        # we are using eager loading here(i.e fetching all related things at one trip only) to prevent N+1 query
        #use selectinload to fetch relationships in 1 optimized batch query
        """
        WITHOUT selectinload (Default Lazy Loading - The N+1 Problem)
        Query 1: SELECT * FROM tickets WHERE organization_id = 'org-123' LIMIT 20; (Returns 20 tickets)
        Query 2: SELECT * FROM users WHERE id = 'user-1'; (For ticket 1)
        Query 3: SELECT * FROM users WHERE id = 'user-2'; (For ticket 2)
        ...
        Query 21: SELECT * FROM users WHERE id = 'user-20'; (For ticket 20)
         Total: 21 separate database round-trips over the network!

        WITH selectinload(Ticket.assigned_to) (Eager Batch Loading)
        Query 1: SELECT * FROM tickets WHERE organization_id = 'org-123' LIMIT 20;
        Query 2: SELECT * FROM users WHERE id IN ('user-1', 'user-2', ..., 'user-20');
         Total: Only 2 database round-trips! (Saves 19 unnecessary network round-trips)
        """
        
        stmt = (
            select(Ticket)
            .options(
                selectinload(Ticket.assigned_to),
                selectinload(Ticket.organization)
            )
            .where(Ticket.organization_id == organization_id)
        )
        if status:
            stmt = stmt.where(Ticket.status == status)
            stmt = stmt.order_by(
                Ticket.created_at.desc()
            ).limit(limit).offset(offset)
        result = await self.session.execute(stmt)
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
        await self.session.refresh(ticket)
        return ticket

        
