from uuid import UUID 
from pydantic import BaseModel, model_validator

from app.models import conversation, knowledge_base

class ChatRequest(BaseModel):
    #if a user blindly joins and in goes to chat then there is not conversation_id yet, it will be created, but when a person joins a chat again, no knowledge_base_id would be requuried as it alr knows from first chat which knowledge base to search for
    conversation_id: UUID | None = None
    knowledge_base_id: UUID | None = None
    question: str

    @model_validator(mode="after")
    def validate_request(self):
        if(
            self.conversation_id is None
            and self.knowledge_base_id is None
        ):
            raise ValueError(
                "Either conversation_id or knowledge_base_id must be provided"
            )
        return self

class ChatResponse(BaseModel):
    conversation_id:UUID
    answer: str