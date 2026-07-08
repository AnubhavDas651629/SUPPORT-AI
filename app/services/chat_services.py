# Question
# ↓
# Retrieve Context
# ↓
# Build Prompt
# ↓
# Call GPT
# ↓
# Return Answer

from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from sqlalchemy.sql.functions import session_user
from app.services.base import BaseService
from .retrieval_service import RetrievalService

class ChatService(BaseService):
    def __init__(self, session: AsyncSession):
        super().__init__(session)
        self.session = session
        self.retrieval_service = RetrievalService(session)

    async def answer(self, *, knowledge_base_id:UUID,question:str, limit: int=5) -> str:
        retrieved_chunks = await self.retrieval_service.retrieve(
            knowledge_base_id=knowledge_base_id,
            question=question,
            limit=limit
        )

        context_text = "\n\n".join(
            chunk.content
            for chunk in retrieved_chunks
        )

