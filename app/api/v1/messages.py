from email import message
from mailbox import Message
from webbrowser import get
from fastapi import APIRouter, Depends, status
from uuid import UUID
from app.db.dependencies import get_db

from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.message_feedback import MessageFeedbackRequest, MessageFeedbackResponse
from app.services.feedback_service import FeedbackService

router = APIRouter(
    prefix="/messages",
    tags=["Messages"]
)

@router.put("/{message_id}/feedback", response_model=MessageFeedbackResponse)
async def submit_feedback(
    message_id: UUID,
    request: MessageFeedbackRequest,
    session: AsyncSession = Depends(get_db)
):
    service = FeedbackService(session=session)

    feedback = await service.submit_feedback(
        message_id=message_id,
        feedback=request.feedback
    )
    return MessageFeedbackResponse.model_validate(
        feedback
    )
