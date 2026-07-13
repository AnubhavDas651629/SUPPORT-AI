from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.message_feedback import FeedbackType, MessageFeedback
from app.repositories.message_feedback_repository import MessageFeedbackRepository
from app.repositories.message_repository import MessageRepository
from app.services.base import BaseService


class FeedbackService(BaseService):
    def __init__(self, *, session: AsyncSession):
        super().__init__(session)

        self.message_repository = MessageRepository(session)
        self.message_feedback_repository = MessageFeedbackRepository(session)

    async def submit_feedback(self, *, message_id:UUID, feedback:FeedbackType) -> MessageFeedback:
        message = await self.message_repository.get_by_id(
            message_id=message_id
        )
        if message is None:
            raise MessageNotFoundException()

        existing_feedback = await self.message_feedback_repository.get_by_message_id(
            message_id=message_id
        )
        if existing_feedback is not None:
            return await self.message_feedback_repository.update(
                message_feedback=existing_feedback,
                feedback=feedback
            )
        return await self.message_feedback_repository.create(
            message_id=message_id,
            feedback=feedback
        )