from fastapi import APIRouter, Depends, status
from uuid import UUID
from app.db.dependencies import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User

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
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = FeedbackService(session=session)

    feedback = await service.submit_feedback(
        message_id=message_id,
        feedback=request.feedback,
        current_user=current_user,
    )
    return MessageFeedbackResponse.model_validate(
        feedback
    )
