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
from sqlalchemy.ext.asyncio import AsyncSession
from app.dto import citation
from app.dto.chat import ChatResult
from app.models import conversation
from app.models.message import Message, MessageRole
from app.services.base import BaseService
from app.services.conversation_services import ConversationService
from app.services.escalation_service import EscalationService
from app.services.retrieval_service import RetrievalService
from collections.abc import AsyncGenerator
from app.processing.llms.factory import LLMFactory
from app.models.document_chunk import DocumentChunk
from app.utils.prompt_loader import load_prompt
from app.services.knowledge_base_service import KnowledgeBaseService
from app.dto.citation import Citation

class ChatService(BaseService):
    def __init__(self, session: AsyncSession):
        super().__init__(session)

        self.retrieval_service = RetrievalService(session=session)
        self.llm_provider = LLMFactory.get_provider()
        self.escalation_service = EscalationService(session=session)
        self.conversation_service = ConversationService(session=session)
        self.knowledge_base_service = KnowledgeBaseService(session=session)


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


    async def _generate_title(self, *, conversation: str) -> str:
        system_prompt = load_prompt(
            "conversation/title"
        )
        prompt = system_prompt.format(
            conversation=conversation,
        )

        messages = [
            {
                "role": "user",
                "content": prompt,
            }
        ]

        title = await self.llm_provider.complete(
            messages=messages
        )
        return title.strip()

    def _build_title_context(self,*,question: str,answer: str) -> str:
        return f"""USER:{question}
                ASSISTANT:{answer}
                """

    #API calls need direct answer, they donnot want streaming answer but users like streaming answer 
    async def answer(self, *, conversation_id: UUID, question:str, limit: int =5) -> tuple[str, list[Citation], str, Message]:
        conversation = await self.conversation_service.get_conversation(
            conversation_id=conversation_id
        )
        await self.conversation_service.create_message(
            conversation_id=conversation_id,
            role=MessageRole.USER,
            content=question
        )

        history = await self.conversation_service.list_messages(
            conversation_id=conversation.id
        )

        chunks = await self.retrieval_service.retrieve(
            knowledge_base_id=conversation.knowledge_base_id,
            question=question,
            limit=limit
        )

        citations = [
            Citation(
                document_id=chunk.document_id,
                filename=chunk.document.original_filename,
                chunk_index=chunk.chunk_index
            )
            for chunk in chunks
        ]

        messages = self._build_messages(
            history=history,
            chunks=chunks,
            question=question
        )
        result = await self.escalation_service.process(
            conversation=conversation,
            history=history,
            chunks=chunks,
            question=question,
        )

        assistant_message = await self.conversation_service.create_message(
            conversation_id=conversation.id,
            role=MessageRole.ASSISTANT,
            content=result.answer
        )
        title = await self._generate_title(
            conversation=self._build_title_context(
                question=question,
                answer=result.answer,
            )
        )
        await self.conversation_service.update_title(
            conversation=conversation,
            title=title
        )
        return result.answer, citations, title, assistant_message


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

    async def chat(self, *, conversation_id:UUID | None, knowledge_base_id:UUID | None, question: str) -> ChatResult:
        if conversation_id is None:
            knowledge_base = await self.knowledge_base_service.get_knowledge_base(
                knowledge_base_id=knowledge_base_id,
            )
            conversation = await self.conversation_service.create_conversation(
                organization_id=knowledge_base.organization_id,
                knowledge_base_id=knowledge_base_id,
                title=question[:100]
            )
        else:
            conversation = await self.conversation_service.get_conversation(
                conversation_id=conversation_id
            )

        answer, citations, title, assistant_message = await self.answer(
            conversation_id=conversation.id,
            question=question
        )
        return ChatResult(
            conversation_id=conversation.id,
            message_id=assistant_message.id,
            answer=answer,
            citations=citations
        )

    async def stream_chat(self, *, conversation_id: UUID | None, knowledge_base_id:UUID | None, question: str) -> AsyncGenerator[str, None]:
        if conversation_id is None:
            knowledge_base = await self.knowledge_base_service.get_knowledge_base(
                knowledge_base_id=knowledge_base_id
            )
            conversation = await self.conversation_service.create_conversation(
                organization_id=knowledge_base.organization_id,
                knowledge_base_id=knowledge_base.id
            )
        else:
            conversation = await self.conversation_service.get_conversation(
                conversation_id=conversation_id
            )
        async for token in self.stream_answer(
            conversation_id=conversation.id,
            question=question
        ):
            yield token





    