from enum import Enum
from pydantic import BaseModel


class AIAction(str, Enum):
    ANSWER = "ANSWER"
    ESCALATE = "ESCALATE"


class EscalationDecision(BaseModel):
    action: AIAction
    answer: str | None = None
    reason: str | None = None