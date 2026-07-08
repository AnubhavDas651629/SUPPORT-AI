# Question
# ↓
# Retrieve Context
# ↓
# Build Prompt
# ↓
# Call GPT
# ↓
# Return Answer

from alembic import context
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from sqlalchemy.sql.functions import session_user
from app.services.base import BaseService
from app.utils.prompt_loader import load_prompt
from .retrieval_service import RetrievalService
from app.integrations.openai import client

class ChatService(BaseService):
    def __init__(self, session: AsyncSession):
        super().__init__(session)
        self.session = session
        self.retrieval_service = RetrievalService(session=session)

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

        template = load_prompt(
            "customer_support"
        )

        prompt = template.format(
            context=context_text,
            question=question
        )

        response = await client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {
                    "role":"user",
                    "content":prompt
                }
            ],
            temperature=0,
        )

        return response.choices[0].message.content
