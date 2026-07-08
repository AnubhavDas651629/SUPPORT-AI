# Question
# ↓
# Retrieve Context
# ↓
# Build Prompt
# ↓
# Call GPT
# ↓
# Return Answer

from uuid import UUID

from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.integrations.openai import client
from app.repositories.base import BaseService
from app.services.retrieval_service import RetrievalService
from app.utils.prompt_loader import load_prompt
from collections.abc import AsyncGenerator

class ChatService(BaseService):
    def __init__(self, session: AsyncSession):
        super().__init__(session)

        self.retrieval_service = RetrievalService(
            session=session,
        )

    async def _build_messages(
        self,
        *,
        knowledge_base_id: UUID,
        question: str,
        limit: int = 5,
    ) -> list[dict]:

        retrieved_chunks = await self.retrieval_service.retrieve(
            knowledge_base_id=knowledge_base_id,
            question=question,
            limit=limit,
        )

        context_text = "\n\n".join(
            chunk.content
            for chunk in retrieved_chunks
        )

        system_prompt = load_prompt(
            "customer_support/system"
        )

        user_template = load_prompt(
            "customer_support/user"
        )

        user_prompt = user_template.format(
            context=context_text,
            question=question,
        )

        return [
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": user_prompt,
            },
        ]

    #API calls need direct answer, they donnot want streaming answer but users like streaming answer 
    async def answer(
        self,
        *,
        knowledge_base_id: UUID,
        question: str,
        limit: int = 5,
    ) -> str:

        messages = await self._build_messages(
            knowledge_base_id=knowledge_base_id,
            question=question,
            limit=limit,
        )

        response = await client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=messages,
            temperature=0,
        )

        return response.choices[0].message.content or ""

    from collections.abc import AsyncGenerator


async def stream_answer(
    self,
    *,
    knowledge_base_id: UUID,
    question: str,
    limit: int = 5,
) -> AsyncGenerator[str, None]:

    messages = await self._build_messages(
        knowledge_base_id=knowledge_base_id,
        question=question,
        limit=limit,
    )

    stream = await client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=messages,
        temperature=0,
        stream=True,
    )

    async for chunk in stream:
        ...