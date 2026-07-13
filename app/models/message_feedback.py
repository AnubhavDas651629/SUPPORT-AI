from enum import Enum
from uuid import UUID
from app.db.base import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.schema import ForeignKey
from typing import TYPE_CHECKING

from app.models.document import SQLEnum
from app.models.mixins import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.message import Message

class FeedbackType(str, Enum):
    POSITIVE = "POSITIVE"
    NEGATIVE = "NEGATIVE"

class MessageFeedback(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "message_feedbacks"
    message_id: Mapped[UUID] = mapped_column(ForeignKey("messages.id"), nullable=False, index=True)
    feedback: Mapped[FeedbackType] = mapped_column(SQLEnum(FeedbackType), nullable=False)
    message: Mapped["Message"] = relationship(back_populates="feedback")
