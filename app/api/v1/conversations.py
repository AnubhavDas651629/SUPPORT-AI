from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.dependencies import get_db
from app.dependencies.auth import get_current_user
from app.dto.message import SupportReplyRequest
from app.models.user import User
from app.schemas.conversation import (
    ConversationSummaryResponse,
    ConversationDetailResponse,
    MessageResponse,
)
from app.services.conversation_services import ConversationService

router = APIRouter(
    prefix="/conversations",
    tags=["Conversations"],
)


@router.get("", response_model=list[ConversationSummaryResponse])
async def list_conversations(
    organization_id: UUID = Query(...),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    service = ConversationService(session=session)

    conversations = await service.list_conversations(
        organization_id=organization_id,
        current_user=current_user,
        limit=limit,
        offset=offset,
    )

    return [
        ConversationSummaryResponse.model_validate(conversation)
        for conversation in conversations
    ]


@router.get("/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    conversation_id: UUID,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    service = ConversationService(session=session)

    conversation = await service.get_conversation(
        conversation_id=conversation_id,
        current_user=current_user,
    )

    return ConversationDetailResponse.model_validate(
        conversation
    )


@router.post("/{conversation_id}/reply", response_model=MessageResponse)
async def reply_to_conversation(
    conversation_id: UUID,
    request: SupportReplyRequest,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Human agent sends a reply directly on a conversation (from Live Conversations page)."""
    service = ConversationService(session=session)
    message = await service.reply_as_agent(
        conversation_id=conversation_id,
        content=request.content,
        current_user=current_user,
    )
    return MessageResponse.model_validate(message)


@router.delete(
    "/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_conversation(
    conversation_id: UUID,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    service = ConversationService(session=session)

    await service.delete_conversation(
        conversation_id=conversation_id,
        current_user=current_user,
    )

    return Response(status_code=status.HTTP_204_NO_CONTENT)