from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.message_feedback import FeedbackType, MessageFeedback
from app.models.user import User
from app.repositories.message_feedback_repository import MessageFeedbackRepository
from app.repositories.message_repository import MessageRepository
from app.repositories.conversation_repository import ConversationRepository
from app.services.base import BaseService
from app.exceptions.conversation import MessageNotFoundException, ConversationNotFoundException
from app.core.webhook_events import WebhookEventType
from app.utils.webhook_payloads import serialize_feedback_payload
from app.utils.webhook_dispatch import fire_webhook_event


class FeedbackService(BaseService):
    def __init__(self, *, session: AsyncSession):
        super().__init__(session)

        self.message_repository = MessageRepository(session)
        self.message_feedback_repository = MessageFeedbackRepository(session)
        self.conversation_repository = ConversationRepository(session)

    async def submit_feedback(self, *, message_id: UUID, feedback: FeedbackType, current_user: User) -> MessageFeedback:
        message = await self.message_repository.get_by_id(
            message_id=message_id
        )
        if message is None:
            raise MessageNotFoundException()

        conversation = await self.conversation_repository.get_by_id(
            conversation_id=message.conversation_id
        )
        if conversation is None:
            raise ConversationNotFoundException()

        await self._require_member(
            organization_id=conversation.organization_id,
            current_user=current_user,
        )

        existing_feedback = await self.message_feedback_repository.get_by_message_id(
            message_id=message_id
        )
        if existing_feedback is not None:
            updated = await self.message_feedback_repository.update(
                message_feedback=existing_feedback,
                feedback=feedback
            )
            payload = serialize_feedback_payload(
                updated,
                conversation_id=conversation.id,
                organization_id=conversation.organization_id,
            )
            fire_webhook_event(
                str(conversation.organization_id),
                WebhookEventType.FEEDBACK_SUBMITTED.value,
                payload,
            )
            await self.session.commit()
            return updated
        created = await self.message_feedback_repository.create(
            message_id=message_id,
            feedback=feedback
        )
        payload = serialize_feedback_payload(
            created,
            conversation_id=conversation.id,
            organization_id=conversation.organization_id,
        )
        fire_webhook_event(
            str(conversation.organization_id),
            WebhookEventType.FEEDBACK_SUBMITTED.value,
            payload,
        )
        await self.session.commit()
        return created