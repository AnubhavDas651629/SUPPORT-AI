from uuid import UUID
from sqlalchemy.orm import joinedload
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


    async def list_for_ticket(self, *, ticket_id: UUID) -> list[TicketNote]:
        query =(
            select(TicketNote)
            .options(joinedload(TicketNote.author))
            .where(
                TicketNote.ticket_id == ticket_id,
            )
            .order_by(TicketNote.created_at.asc())
        )
        result = await self.session.execute(query)

        return list(result.scalars().all())

    async def get_by_id(self, *, note_id: UUID) -> TicketNote | None:
        query = (
            select(TicketNote)
            .options(joinedload(TicketNote.author))
            .where(
                TicketNote.id == note_id
            )
        )

        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def delete(self, *, ticket_note:TicketNote)-> None:
        await self.session.delete(ticket_note)
        await self.session.flush()