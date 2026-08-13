from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.conversation import Conversation
from app.models.message import Message, MessageRole
from app.models.user import User
from app.repositories.conversation_repository import ConversationRepository
from app.repositories.message_repository import MessageRepository
from app.services.base import BaseService
from app.exceptions.conversation import ConversationNotFoundException


class ConversationService(BaseService):
    def __init__(self, *, session: AsyncSession):
        super().__init__(session)
        self.conversation_repository = ConversationRepository(session)
        self.message_repository = MessageRepository(session)

    async def create_conversation(self, *, organization_id: UUID, knowledge_base_id: UUID, title: str | None) -> Conversation:
        conversation = await self.conversation_repository.create(
            organization_id=organization_id,
            knowledge_base_id=knowledge_base_id,
            title=title
        )
        await self.session.commit()
        return conversation

    async def get_conversation(self, *, conversation_id: UUID, current_user: User | None = None) -> Conversation:
        from app.redis.cache_services import RedisCacheService
        from app.redis.keys import RedisKeys
        from app.schemas.conversation import ConversationResponse

        cache_service = RedisCacheService(self.redis)
        cache_key = RedisKeys.cache_conversation(str(conversation_id))

        # Fast-path: use cached metadata for membership validation only
        cached_conv = await cache_service.get_json(key=cache_key, schema_cls=ConversationResponse)
        if cached_conv:
            if current_user is not None:
                await self._require_member(
                    organization_id=cached_conv.organization_id,
                    current_user=current_user,
                )
            # Still fetch from DB so eager-loaded relationships (messages) are present
            conversation = await self.conversation_repository.get_by_id(
                conversation_id=conversation_id,
            )
            if conversation is None:
                raise ConversationNotFoundException()
            return conversation

        conversation = await self.conversation_repository.get_by_id(
            conversation_id=conversation_id,
        )
        if conversation is None:
            raise ConversationNotFoundException()

        if current_user is not None:
            await self._require_member(
                organization_id=conversation.organization_id,
                current_user=current_user,
            )

        await cache_service.set_json(
            key=cache_key,
            value=ConversationResponse.model_validate(conversation),
            ttl=3600,
        )
        return conversation

    async def create_message(self,*, conversation_id: UUID, role: MessageRole, content: str) -> Message:
        message = await self.message_repository.create(
            conversation_id=conversation_id,
            role=role,
            content=content
        )
        await self.session.commit()
        await self.session.refresh(message)
        return message

    async def reply_as_agent(self, *, conversation_id: UUID, content: str, current_user: User) -> Message:
        """Create a SUPPORT message on a conversation from the Live Conversations page."""
        from app.core.webhook_events import WebhookEventType
        from app.utils.webhook_payloads import serialize_message_payload
        from app.utils.webhook_dispatch import fire_webhook_event

        conversation = await self.get_conversation(
            conversation_id=conversation_id,
            current_user=current_user,
        )
        message = await self.message_repository.create(
            conversation_id=conversation.id,
            role=MessageRole.SUPPORT,
            content=content,
        )
        fire_webhook_event(
            str(conversation.organization_id),
            WebhookEventType.MESSAGE_CREATED.value,
            serialize_message_payload(message, organization_id=conversation.organization_id),
        )
        await self.session.commit()
        await self.session.refresh(message)
        return message

    
    async def list_messages(self, *, conversation_id: UUID) -> list[Message]:
        return await self.message_repository.list_for_conversation(
            conversation_id=conversation_id
        )

    async def update_title(self, *, conversation: Conversation, title: str) -> str:
        title = await self.conversation_repository.update_title(
            conversation=conversation,
            title=title
        )
        from app.redis.cache_services import RedisCacheService
        from app.redis.keys import RedisKeys
        await RedisCacheService(self.redis).delete(key=RedisKeys.cache_conversation(str(conversation.id)))
        return title
        

    async def list_conversations(self, *, organization_id: UUID, current_user: User, limit: int = 20, offset: int = 0) -> list[Conversation]:
        await self._require_member(
            organization_id=organization_id,
            current_user=current_user,
        )
        return await self.conversation_repository.list_for_organization(
            organization_id=organization_id,
            limit=limit,
            offset=offset
        )

    async def delete_conversation(self, *, conversation_id: UUID, current_user: User) -> None:
        conversation = await self.get_conversation(
            conversation_id=conversation_id,
            current_user=current_user,
        )

        await self.conversation_repository.delete(
            conversation=conversation,
        )
        await self.session.commit()

        from app.redis.cache_services import RedisCacheService
        from app.redis.keys import RedisKeys
        await RedisCacheService(self.redis).delete(key=RedisKeys.cache_conversation(str(conversation_id)))
