from dataclasses import dataclass
from uuid import UUID


@dataclass
class EscalationResult:
    answer: str
    escalated: bool
    ticket_id: UUID | None = None