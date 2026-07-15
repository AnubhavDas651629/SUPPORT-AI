from enum import Enum
from sqlalchemy import Text
from uuid import UUID

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.document import SQLEnum
from app.models.mixins import TimestampMixin, UUIDMixin
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.ticket import Ticket
    from app.models.user import User

class TicketEventType(str, Enum):
    CREATED = "CREATED"
    ASSIGNED = "ASSIGNED"
    STATUS_CHANGED = "STATUS_CHANGED"
    PRIORITY_CHANGED = "PRIORITY_CHANGED"
    REPLIED = "REPLIED"
    NOTE_ADDED = "NOTE_ADDED"
    CLOSED = "CLOSED"

class TicketEvent(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "ticket_events"
    ticket_id: Mapped[UUID] = mapped_column(ForeignKey("tickets.id"),nullable=False,index=True)
    user_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"),nullable=True,index=True)
    event_type: Mapped[TicketEventType] = mapped_column(SQLEnum(TicketEventType),nullable=False)
    description: Mapped[str] = mapped_column(Text,nullable=False)
    ticket: Mapped["Ticket"] = relationship(back_populates="events")
    user: Mapped["User | None"] = relationship(back_populates="ticket_events")