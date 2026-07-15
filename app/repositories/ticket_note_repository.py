from uuid import UUID
from sqlalchemy.orm import query
from app.api.v1 import ticket
from app.models.ticket import Ticket
from sqlalchemy import select
from app.models.ticket_note import TicketNote
from app.repositories.base import BaseRepository


class TicketNoteRepository(BaseRepository):
    async def create(self, *,ticket_id: UUID, author_id: UUID, content: str) -> TicketNote:
        ticket_note = TicketNote(
            ticket_id = ticket_id,
            author_id = author_id,
            content = content
        )
        self.session.add(ticket_note)
        await self.session.flush()
        return ticket_note


    async def list_for_tickets(self, *, ticket_id: UUID) -> list[TicketNote]:
        query =(
            select(TicketNote)
            .where(
                TicketNote.ticket_id == ticket_id,
            )
        )
        result = await self.session.execute(query)

        return list(result.scalars().all())

    async def get_by_id(self, *, note_id: UUID) -> TicketNote | None:
        query = (
            select(TicketNote)
            .where(
                TicketNote.id == note_id
            )
        )

        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def delete(self, *, ticket_note:TicketNote)-> None:
        await self.session.delete(ticket_note)
        await self.session.flush()