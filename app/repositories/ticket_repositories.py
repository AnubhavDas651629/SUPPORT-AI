from uuid import UUID
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload

from app.models.ticket import Ticket, TicketPriority, TicketStatus
from app.models.user import User
from app.repositories.base import BaseRepository
from app.utils.cursor import decode_cursor

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


    async def list_for_organization_paginated(self, *,
    organization_id:UUID, 
    status: TicketStatus | None = None,
    priority: TicketPriority | None = None,
    search: str | None = None,
    cursor: str | None = None, 
    limit: int = 20,
    ) -> tuple[list[Ticket], bool]:
        """
        purpose of this function ->
        1)Multi criteria filtering: filters by status(OPEN/RESOLVED), priority(HIGH/LOW) and case insensitive "search" keywords
        2) Fast cursor Pagination: uses base64 cursor to jump directly to the next page of tickets in < 1ms
        3)has_more detection
        returns (tickets, has_more)
        """

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

        # base query + eager loading
        stmt = (
            select(Ticket)
            .options(
                selectinload(Ticket.assigned_to),
                selectinload(Ticket.organization)
            )
            .where(
                Ticket.organization_id == organization_id
            )
        )

        if status:
            stmt = stmt.where(Ticket.status == status)
        if priority:
            stmt = stmt.where(Ticket.priority == priority)

        # if search:: Uses .ilike("%search%") for case-insensitive subject search (e.g. searching "login" matches "Login Issue" and "CANNOT LOGIN").
        if search:
            stmt = stmt.where(Ticket.subject.ilike(f"%{search.strip()}%"))

        if cursor:
            try:
                cursor_dt, cursor_id = decode_cursor(cursor)
                stmt = stmt.where(
                    or_(
                        Ticket.created_at < cursor_dt,
                        (Ticket.created_at == cursor_dt) & (Ticket.id < cursor_id)
                    )
                )
            except ValueError:
                pass


        """
        If you ask for 20 items and PostgreSQL returns 20, you don't know if there is a 21st item on the next page unless you run a slow SELECT COUNT(*) query.
        The Trick: We ask PostgreSQL for 21 items:
        If PostgreSQL returns 21 items: has_more = True! We trim off the 21st item (tickets[:20]), return 20 items to the user, and set has_more = True so the frontend shows the "Next Page" button!
        If PostgreSQL returns 20 or fewer items: has_more = False (we reached the last page of the database!).
        """
        stmt = stmt.order_by(Ticket.created_at.desc(), Ticket.id.desc()).limit(limit + 1)

        result = await self.session.execute(stmt)
        tickets = list(result.scalars().all())

        has_more = len(tickets) > limit
        if has_more:
            tickets = tickets[:limit]

        return tickets, has_more






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

        
