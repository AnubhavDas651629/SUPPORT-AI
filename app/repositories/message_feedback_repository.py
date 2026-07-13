from sqlalchemy import select
from app.models.message_feedback import FeedbackType
from app.repositories.base import BaseRepository
from uuid import UUID
from app.models.message_feedback import MessageFeedback


class MessageFeedbackRepository(BaseRepository):
    async def create(self, *, message_id: UUID,feedback: FeedbackType) -> MessageFeedback:
        message_feedback = MessageFeedback(
            message_id=message_id,
            feedback=feedback
        )
        self.session.add(message_feedback)
        await self.session.flush()
        return message_feedback

    async def get_by_message_id(self, *, message_id: UUID) -> MessageFeedback | None:
        query  = (
            select(MessageFeedback)
            .where(
                MessageFeedback.message_id == message_id
            )
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def update(self, *, message_feedback: MessageFeedback, feedback: FeedbackType) -> MessageFeedback:
        message_feedback.feedback = feedback
        await self.session.flush()
        return message_feedback