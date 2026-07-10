from sqlalchemy import select
from app.models.conversation import Conversation
from app.repositories.base import BaseRepository
from uuid import UUID
from app.models.conversation import Conversation


class ConversationRepository(BaseRepository):
    async def create(self, *, organization_id: UUID, knowledge_base_id: UUID, title: str | None = None) -> Conversation:
        conversation = Conversation(
            organization_id = organization_id,
            knowledge_base_id = knowledge_base_id,
            title = title
        )
        self.session.add(conversation)
        await self.session.flush()
        return conversation

    async def get_by_id(self, *, conversation_id: UUID) -> Conversation | None:
        query = (
            select(Conversation)
            .where(
                Conversation.id == conversation_id
            )
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def list_for_organization(self, *, organization_id: UUID) -> list[Conversation]:
        query = (
            select(Conversation)
            .where(
                Conversation.organization_id == organization_id
            )
            .order_by(
                Conversation.updated_at.desc()
            )
        )
        result = await self.session.execute(query)

        return result.scalars().all()

    async def delete(self, *, conversation: Conversation) -> None:
        await self.session.delete(conversation)