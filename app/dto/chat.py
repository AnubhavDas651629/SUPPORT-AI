#data transfer object
# this is not pydantic this is simple python, why are we doing it here ->
# BECAUSE SERVICES SHOULD NOT KNOW ABOUT API SCHEMAS

from dataclasses import dataclass
from uuid import UUID

from app.dto.citation import Citation
from app.models import conversation

@dataclass
class ChatResult:
    conversation_id:UUID
    answer: str
    citations: list[Citation]