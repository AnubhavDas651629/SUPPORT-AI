from sqlalchemy.ext.asyncio import AsyncSession
from app.dto import escalation
from app.dto.escalation import AIAction, EscalationDecision
from app.dto.escalation_result import EscalationResult
from app.models.conversation import Conversation
from app.models.document_chunk import DocumentChunk
from app.models.ticket import TicketPriority
from app.processing.llms.factory import LLMFactory
from app.services.base import BaseService
from app.services.ticket_service import TicketService
from app.models.message import Message
from app.utils.prompt_loader import load_prompt


class EscalationService(BaseService):
    def __init__(self, *, session: AsyncSession):
        super().__init__(session)
        self.ticket_service = TicketService(session=session)
        self.llm_provider = LLMFactory.get_provider()

    def _build_messages(self, *, history:list[Message], chunks: list[DocumentChunk], question: str) -> list[dict]:
        context = "\n\n".join(
            chunk.content
            for chunk in chunks
        )

        history_text = "\n".join(
            f"{message.role.value}: {message.content}"
            for message in history
        )

        prompt = load_prompt(
            "customer_support/escalation"
        )

        user_prompt = prompt.format(
            history=history_text,
            context=context, 
            question=question
        )
        return [
        {
            "role": "user",
            "content": user_prompt,
        }
    ]


    async def process(self, *, conversation: Conversation, history: list[Message], chunks: list[DocumentChunk], question:str) -> EscalationResult:
        messages = self._build_messages(
            history=history,
            chunks=chunks,
            question=question
        )

        decision = await self.llm_provider.complete_structured(
            messages=messages,
            response_model=EscalationDecision
        )

        if decision.action == AIAction.ANSWER:
            return EscalationResult(
                answer=decision.answer or "",
                escalated=False,
            )

        ticket = await self.ticket_service.create_ticket(
            conversation_id=conversation.id,
            priority=TicketPriority.MEDIUM,
        )

        escalation_message = load_prompt(
            "responses/user_escalated"
        )

        return EscalationResult(
            answer= escalation_message,
            escalated=True,
            ticket_id=ticket.id,
        )