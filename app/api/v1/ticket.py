from uuid import UUID
from fastapi import APIRouter, Depends, Query, status, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.dependencies import get_db
from app.schemas.ticket import AssignTicketRequest, CreateTicketRequest, TicketResponse, UpdateTicketPriorityRequest, UpdateTicketStatusRequest
from app.services.ticket_service import TicketService


router = APIRouter(
    prefix="/tickets",
    tags=["Tickets"],
)

@router.post("", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    request: CreateTicketRequest,
    session: AsyncSession = Depends(get_db)
):
    service = TicketService(session=session)

    ticket = await service.create_ticket(
        conversation_id=request.conversation_id,
        priority=request.priority
    )
    return TicketResponse.model_validate(ticket)

@router.get("", response_model=list[TicketResponse])
async def list_tickets(
    organization_id: UUID = Query(...),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_db),
):

    service = TicketService(session=session)

    tickets = await service.list_tickets(
        organization_id=organization_id,
        limit=limit,
        offset=offset,
    )

    return [
        TicketResponse.model_validate(ticket)
        for ticket in tickets
    ]


@router.get("/{ticket_id}",response_model=TicketResponse,)
async def get_ticket(
    ticket_id: UUID,
    session: AsyncSession = Depends(get_db),
):

    service = TicketService(session=session)

    ticket = await service.get_ticket(
        ticket_id=ticket_id,
    )

    return TicketResponse.model_validate(ticket)

@router.patch("/{ticket_id}/status",response_model=TicketResponse)
async def update_status(
    ticket_id: UUID,
    request: UpdateTicketStatusRequest,
    session: AsyncSession = Depends(get_db),
):

    service = TicketService(session=session)

    ticket = await service.update_status(
        ticket_id=ticket_id,
        status=request.status,
    )

    return TicketResponse.model_validate(ticket)

@router.patch(
    "/{ticket_id}/priority",
    response_model=TicketResponse,
)
async def update_priority(
    ticket_id: UUID,
    request: UpdateTicketPriorityRequest,
    session: AsyncSession = Depends(get_db),
):

    service = TicketService(session=session)

    ticket = await service.update_priority(
        ticket_id=ticket_id,
        priority=request.priority,
    )

    return TicketResponse.model_validate(ticket)


@router.delete("/{ticket_id}",status_code=status.HTTP_204_NO_CONTENT,)
async def delete_ticket(
    ticket_id: UUID,
    session: AsyncSession = Depends(get_db),
):

    service = TicketService(session=session)

    await service.delete_ticket(
        ticket_id=ticket_id,
    )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )


@router.patch("/{ticket_id}/assign", response_model=TicketResponse)
async def assign_ticket(
    ticket_id: UUID, 
    request: AssignTicketRequest,
    session: AsyncSession = Depends(get_db)
):
    service = TicketService(session=session)

    ticket = await service.assign_ticket(
        ticket_id=ticket_id,
        user_id = request.user_id
    )

    return TicketResponse.model_validate(ticket)


