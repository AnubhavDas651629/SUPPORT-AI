from sqlalchemy import desc
from app.schemas.pagination import CursorPageResponse
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.dependencies import get_db
from app.dependencies.auth import get_current_user
from app.dto.message import SupportReplyRequest
from app.models.user import User
from app.schemas.conversation import MessageResponse
from app.schemas.ticket import AssignTicketRequest, CreateTicketRequest, TicketResponse, UpdateTicketPriorityRequest, UpdateTicketStatusRequest
from app.services.ticket_service import TicketService
from app.models.ticket import TicketStatus, TicketPriority


router = APIRouter(
    prefix="/tickets",
    tags=["Tickets"],
)

@router.post("", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    request: CreateTicketRequest,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = TicketService(session=session)

    ticket = await service.create_ticket(
        conversation_id=request.conversation_id,
        priority=request.priority,
        current_user=current_user,
    )
    return TicketResponse.model_validate(ticket)

@router.get("", response_model=CursorPageResponse[TicketResponse])
async def list_tickets(
    organization_id: UUID = Query(...),
    status: TicketStatus | None = Query(None, description="Filter by status"),
    priority: TicketPriority | None = Query(None, description="Filer by priority"),
    search: str | None = Query(None, description="Search ticket subject"),
    cursor: str | None = Query(None, description="Base64 pagination cursor"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = TicketService(session=session)

    tickets, next_cursor, has_more = await service.list_tickets_paginated(
        organization_id=organization_id,
        current_user=current_user,
        status=status,
        priority=priority,
        search=search,
        cursor=cursor,
        limit=limit
    )

    items = [TicketResponse.model_validate(t) for t in tickets]
    return CursorPageResponse[TicketResponse](
        items=items,
        next_cursor=next_cursor,
        has_more=has_more,
    )


@router.get("/{ticket_id}", response_model=TicketResponse)
async def get_ticket(
    ticket_id: UUID,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    service = TicketService(session=session)

    ticket = await service.get_ticket(
        ticket_id=ticket_id,
        current_user=current_user,
    )

    return TicketResponse.model_validate(ticket)

@router.patch("/{ticket_id}/status", response_model=TicketResponse)
async def update_status(
    ticket_id: UUID,
    request: UpdateTicketStatusRequest,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    service = TicketService(session=session)

    ticket = await service.update_status(
        ticket_id=ticket_id,
        status=request.status,
        current_user=current_user,
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
    current_user: User = Depends(get_current_user),
):

    service = TicketService(session=session)

    ticket = await service.update_priority(
        ticket_id=ticket_id,
        priority=request.priority,
        current_user=current_user,
    )

    return TicketResponse.model_validate(ticket)


@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ticket(
    ticket_id: UUID,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    service = TicketService(session=session)

    await service.delete_ticket(
        ticket_id=ticket_id,
        current_user=current_user,
    )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )


@router.patch("/{ticket_id}/assign", response_model=TicketResponse)
async def assign_ticket(
    ticket_id: UUID, 
    request: AssignTicketRequest,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = TicketService(session=session)

    ticket = await service.assign_ticket(
        ticket_id=ticket_id,
        user_id=request.user_id,
        current_user=current_user,
    )

    return TicketResponse.model_validate(ticket)

@router.post("/{ticket_id}/reply", response_model=MessageResponse)
async def reply_to_ticket(
    ticket_id: UUID,
    request: SupportReplyRequest,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = TicketService(session=session)

    message = await service.reply_to_ticket(
        ticket_id=ticket_id,
        content=request.content,
        current_user=current_user,
    )

    return MessageResponse.model_validate(message)


