from mailbox import Message
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.conversation import Conversation
from app.models.message import MessageRole
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

    async def get_conversation(self, *, conversation_id: UUID) -> Conversation:
        conversation = await self.conversation_repository.get_by_id(
            conversation_id=conversation_id
        )
        if conversation is None:
            raise ConversationNotFoundException()

        return conversation

    async def create_message(self,*, conversation_id: UUID, role: MessageRole, content: str) -> Message:
        message = await self.message_repository.create(
            conversation_id=conversation_id,
            role=role,
            content=content
        )
        await self.session.commit()
        return message

    
    async def list_messages(self, *, conversation_id: UUID) -> list[Message]:
        return await self.message_repository.list_for_conversation(
            conversation_id=conversation_id
        )
        

    async def update_title(self, *, conversation: Conversation, title: str | None) -> str:
        conversation.title = title
        await self.session.flush()
        await self.session.commit()
        return title or ""


    async def list_conversations():
        pass

    async def get_conversation_detail():
        pass
