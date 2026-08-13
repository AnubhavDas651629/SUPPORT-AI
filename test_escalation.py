import asyncio
from app.db.session import AsyncSessionLocal
from app.services.escalation_service import EscalationService
from app.models.message import Message, MessageRole
from app.models.conversation import Conversation
from uuid import uuid4

async def main():
    async with AsyncSessionLocal() as session:
        service = EscalationService(session=session)
        conversation = Conversation(id=uuid4(), organization_id=uuid4(), knowledge_base_id=uuid4(), title="test")
        history = [Message(role=MessageRole.USER, content="your answers are bad")]
        
        result = await service.process(conversation=conversation, history=history, chunks=[], question="your answers are bad")
        print("Escalated:", result.escalated)
        print("Answer:", result.answer)

asyncio.run(main())
