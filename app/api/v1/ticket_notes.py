from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.dependencies import get_db
from app.schemas.ticket_note import (
    CreateTicketNoteRequest,
    TicketNoteResponse,
)
from app.services.ticket_note_service import TicketNoteService

router = APIRouter(
    prefix="/tickets",
    tags=["Ticket Notes"],
)

@router.post(
    "/{ticket_id}/notes",
    response_model=TicketNoteResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_note(
    ticket_id: UUID,
    request: CreateTicketNoteRequest,
    session: AsyncSession = Depends(get_db),
):

    service = TicketNoteService(session=session)

    note = await service.create_note(
        ticket_id=ticket_id,
        author_id=request.author_id,
        content=request.content,
    )

    await session.commit()

    return TicketNoteResponse.model_validate(note)


@router.get(
    "/{ticket_id}/notes",
    response_model=list[TicketNoteResponse],
)
async def list_notes(
    ticket_id: UUID,
    session: AsyncSession = Depends(get_db),
):

    service = TicketNoteService(session=session)

    notes = await service.list_notes(
        ticket_id=ticket_id,
    )

    return [
        TicketNoteResponse.model_validate(note)
        for note in notes
    ]


@router.delete(
    "/notes/{note_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_note(
    note_id: UUID,
    session: AsyncSession = Depends(get_db),
):

    service = TicketNoteService(session=session)

    await service.delete_note(
        note_id=note_id,
    )

    await session.commit()

    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )