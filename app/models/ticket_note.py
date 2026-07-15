from uuid import UUID
from sqlalchemy import ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.mixins import TimestampMixin, UUIDMixin
from app.db.base import Base
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.models.ticket import Ticket
if TYPE_CHECKING:
    from app.models.user import User



class TicketNote(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "ticket_notes"
    ticket_id: Mapped[UUID] = mapped_column(ForeignKey("tickets.id"), nullable=False, index = True)
    author_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text,nullable=False)
    ticket: Mapped["Ticket"] = relationship(back_populates="notes")
    author: Mapped["User"] = relationship(back_populates="ticket_notes")

