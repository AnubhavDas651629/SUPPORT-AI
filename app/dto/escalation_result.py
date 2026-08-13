from dataclasses import dataclass
from uuid import UUID


@dataclass
class EscalationResult:
    escalated: bool
    answer: str | None = None
    ticket_id: UUID | None = None