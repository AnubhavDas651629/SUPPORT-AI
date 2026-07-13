from enum import Enum
from sqlalchemy import Boolean, String
from uuid import UUID

from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.document import SQLEnum
from app.models.mixins import TimestampMixin, UUIDMixin


if TYPE_CHECKING:
    from app.models.conversation import Conversation
if TYPE_CHECKING:
    from app.models.organization import Organization

class TicketStatus(str, Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    WAITING_CUSTOMER = "WAITING_CUSTOMER"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"

class TicketPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"

class Ticket(Base,UUIDMixin, TimestampMixin):
    __tablename__ = "tickets"
    conversation_id: Mapped[UUID] = mapped_column(ForeignKey("conversations.id"),index = True, unique=True, nullable=False)
    organization_id: Mapped[UUID] = mapped_column(ForeignKey("organizations.id"), nullable=False, index=True)
    status: Mapped[TicketStatus] = mapped_column(SQLEnum(TicketStatus), nullable=False, default=TicketStatus.OPEN)
    priority: Mapped[TicketPriority] = mapped_column(SQLEnum(TicketPriority), nullable=False, default=TicketPriority.MEDIUM)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    created_by_ai: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    conversation: Mapped["Conversation"] = relationship(back_populates="ticket")
    organization: Mapped["Organization"] = relationship(back_populates="tickets")