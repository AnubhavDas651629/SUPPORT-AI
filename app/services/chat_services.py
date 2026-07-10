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

from alembic.command import history
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import conversation
from app.models.message import Message, MessageRole
from app.repositories.base import BaseService
from app.services.conversation_services import ConversationService
from app.services.retrieval_service import RetrievalService
from collections.abc import AsyncGenerator
from app.processing.llms.factory import LLMFactory
from collections.abc import AsyncGenerator
from app.models.document_chunk import DocumentChunk
from app.utils.prompt_loader import load_prompt


class ChatService(BaseService):
    def __init__(self, session: AsyncSession):
        super().__init__(session)

        self.retrieval_service = RetrievalService(session=session)
        self.llm_provider = LLMFactory.get_provider()
        self.conversational_service = ConversationService(session=session)

    def _build_messages(self, *, history: list[Message], chunks:list[DocumentChunk], question:str) -> list[str]:
        history_text = "\n\n".join(
            f"{message.role.value}: {message.content}"
            for message in history
        )

        context_text = "\n\n".join(
            chunk.content
            for chunk in chunks
        )

        system_prompt = load_prompt(
            "customer_support/system"
        )

        user_template = load_prompt(
            "customer_support/user"
        )

        user_prompt = user_template.format(
            history=history_text,
            context=context_text,
            question=question
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
    async def answer(self, *, conversation_id: UUID, question:str, limit: int =5) -> str:
        conversation = await self.conversational_service.get_conversation(
            conversation_id=conversation_id
        )
        await self.conversational_service.create_message(
            conversation_id=conversation_id,
            role=MessageRole.USER,
            content=question
        )

        history = await self.conversational_service.list_messages(
            conversation_id=conversation.id
        )

        chunks = await self.retrieval_service.retrieve(
            knowledge_base_id=conversation.knowledge_base_id,
            question=question,
            limit=limit
        )

        messages = self._build_messages(
            history=history,
            chunks=chunks,
            question=question
        )
        answer = await self.llm_provider.complete(
            messages=messages
        )

        await self.conversational_service.create_message(
            conversation_id=conversation.id,
            role=MessageRole.ASSISTANT,
            content=answer
        )
        return answer



    async def stream_answer(
        self,
        *,
        conversation_id: UUID,
        question: str,
        limit: int = 5,
    ) -> AsyncGenerator[str, None]:

        conversation = await self.conversation_service.get_conversation(
            conversation_id=conversation_id
        )

        await self.conversation_service.create_message(
            conversation_id=conversation.id,
            role=MessageRole.USER,
            content=question,
        )

        history = await self.conversation_service.list_messages(
            conversation_id=conversation.id
        )

        chunks = await self.retrieval_service.retrieve(
           knowledge_base_id=conversation.knowledge_base_id,
            question=question,
            limit=limit,
        )

        messages = self._build_messages(
            history=history,
            chunks=chunks,
            question=question,
        )

        full_answer = ""

        async for token in self.llm_provider.stream(
            messages=messages,
        ):
            full_answer += token
            yield token

        await self.conversation_service.create_message(
            conversation_id=conversation.id,
            role=MessageRole.ASSISTANT,
            content=full_answer,
        )