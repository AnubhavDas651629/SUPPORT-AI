# POST /chat
#       │
#       ▼
# ChatRouter
#       │
#       ▼
# ChatService.chat()
#       │
#       ├───────────────┐
#       │               │
# New Conversation?     Existing Conversation?
#       │               │
#       ▼               ▼
# ConversationService   ConversationService
# (create)             (get)
#       │               │
#       └───────┬───────┘
#               ▼
#          answer()
#               │
#       Save USER message
#               │
#       Retrieve Context
#               │
#       Build Prompt
#               │
#          Call GPT
#               │
#     Save ASSISTANT message
#               │
#               ▼
#         Return ChatResult
#               │
#               ▼
#          ChatResponse

from sys import prefix
from fastapi import APIRouter, Depends
from app import db
from app.dto import citation
from app.schemas.chat import ChatRequest, ChatResponse, CitationResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.dependencies import get_db
from app.services.chat_services import ChatService
from app.api.v1.auth import router
from fastapi.responses import StreamingResponse

router = APIRouter(
    prefix ="/chat",
    tags=["Chat"]
)

@router.post("",response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    session: AsyncSession = Depends(get_db),
):

    service = ChatService(session=session)

    result = await service.chat(
        conversation_id=request.conversation_id,
        knowledge_base_id=request.knowledge_base_id,
        question=request.question,
    )

    return ChatResponse(
    conversation_id=result.conversation_id,
    message_id=result.message_id,
    answer=result.answer,
    citations=[
        CitationResponse(
            document_id=citation.document_id,
            filename=citation.filename,
            chunk_index=citation.chunk_index,
        )
        for citation in result.citations
    ],
)

@router.post("/stream")
async def stream_chat(
    request: ChatRequest,
    session: AsyncSession = Depends(get_db)
):
    service = ChatService(session=session)

    generator = service.stream_chat(
        conversation_id=request.conversation_id,
        knowledge_base_id=request.knowledge_base_id,
        question=request.question
    )

    return StreamingResponse(
        generator,
        media_type="text/event-stream"
    )



