from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.dependencies import get_db
from app.schemas.conversation import (
    ConversationSummaryResponse,
    ConversationDetailResponse,
)
from app.services.conversation_services import ConversationService
router = APIRouter(
    prefix="/conversations",
    tags=["Conversations"],
)


@router.get("",response_model=list[ConversationSummaryResponse])
async def list_conversations(
    organization_id: UUID = Query(...),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_db),
):

    service = ConversationService(session=session)

    conversations = await service.list_conversations(
        organization_id=organization_id,
        limit=limit,
        offset=offset,
    )

    return [
        ConversationSummaryResponse.model_validate(conversation)
        for conversation in conversations
    ]


@router.get("/{conversation_id}",response_model=ConversationDetailResponse)
async def get_conversation(
    conversation_id: UUID,
    session: AsyncSession = Depends(get_db),
):

    service = ConversationService(session=session)

    conversation = await service.get_conversation(
        conversation_id=conversation_id,
    )

    return ConversationDetailResponse.model_validate(
        conversation
    )


@router.delete(
    "/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_conversation(
    conversation_id: UUID,
    session: AsyncSession = Depends(get_db),
):

    service = ConversationService(session=session)

    await service.delete_conversation(
        conversation_id=conversation_id,
    )

    return Response(status_code=status.HTTP_204_NO_CONTENT)