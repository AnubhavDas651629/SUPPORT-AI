from sqlalchemy import select

from app.models.message import MessageRole
from app.repositories.base import BaseRepository
from uuid import UUID
from app.models.message import Message


class MessageRepository(BaseRepository):
    async def create(self, *, conversation_id: UUID, role:MessageRole, content: str ) -> Message:
        message = Message(
            conversation_id = conversation_id,
            role = role,
            content = content
        )
        self.session.add(message)
        await self.session.flush()
        return message

    async def list_for_conversation(self, *, conversation_id: UUID) -> list[Message]:
        query = (
            select(Message)
            .where(
                Message.conversation_id == conversation_id
            )
            .order_by(
                Message.created_at
            )
        )
        result = await self.session.execute(query)
        return result.scalars().all()



    async def delete(self, *, message: Message) -> None:
        await self.session.delete(message)