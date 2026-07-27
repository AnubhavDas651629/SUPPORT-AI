from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions.ticket import TicketNotFoundException, TicketNoteNotFoundException
from app.models.ticket_note import TicketNote
from app.models.ticket_event import TicketEventType
from app.models.user import User
from app.repositories.ticket_note_repository import TicketNoteRepository
from app.repositories.ticket_repositories import TicketRepository
from app.services.base import BaseService
from app.services.ticket_event_service import TicketEventService


class TicketNoteService(BaseService):

    def __init__(self, *, session: AsyncSession):
        super().__init__(session)

        self.ticket_repository = TicketRepository(session=session)
        self.ticket_note_repository = TicketNoteRepository(session=session)
        self.ticket_event_service = TicketEventService(session=session)

    async def create_note(
        self,
        *,
        ticket_id: UUID,
        author_id: UUID,
        content: str,
        current_user: User | None = None,
    ) -> TicketNote:

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

        note = await self.ticket_note_repository.create(
            ticket_id=ticket.id,
            author_id=author_id,
            content=content,
        )

        await self.ticket_event_service.create_event(
            ticket_id=ticket.id,
            user_id=author_id,
            event_type=TicketEventType.NOTE_ADDED,
            description="Internal note added.",
        )

        return note

    async def list_notes(
        self,
        *,
        ticket_id: UUID,
        current_user: User | None = None,
    ) -> list[TicketNote]:

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

        return await self.ticket_note_repository.list_for_ticket(
            ticket_id=ticket.id,
        )

    async def delete_note(
        self,
        *,
        note_id: UUID,
        current_user: User | None = None,
    ) -> None:

        note = await self.ticket_note_repository.get_by_id(
            note_id=note_id,
        )

        if note is None:
            raise TicketNoteNotFoundException()

        ticket = await self.ticket_repository.get_by_id(
            ticket_id=note.ticket_id,
        )
        if ticket is not None and current_user is not None:
            await self._require_member(
                organization_id=ticket.organization_id,
                current_user=current_user,
            )

        await self.ticket_note_repository.delete(
            ticket_note=note,
        )