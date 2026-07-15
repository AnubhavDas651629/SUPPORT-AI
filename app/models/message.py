from sqlalchemy import ForeignKey
from app.models import conversation
from app.models.document import SQLEnum
from app.models.mixins import TimestampMixin, UUIDMixin
from app.db.base import Base
from sqlalchemy.orm import Mapped,mapped_column, relationship
from uuid import UUID
from sqlalchemy import Text
from enum import Enum
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.conversation import Conversation
if TYPE_CHECKING:
    from app.models.message_feedback import MessageFeedback

class MessageRole(str, Enum):
    USER = "USER"
    ASSISTANT = "ASSISTANT"
    SUPPORT = "SUPPORT"
    SYSTEM = "SYSTEM"


class Message(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "messages"
    conversation_id: Mapped[UUID] = mapped_column(ForeignKey("conversations.id"), nullable=False, index=True)
    role: Mapped[MessageRole] = mapped_column(SQLEnum(MessageRole), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    conversation: Mapped[list["Conversation"]] = relationship(back_populates="messages")
    feedback: Mapped[list["MessageFeedback"]] = relationship(back_populates="message", cascade="all, delete-orphan")

