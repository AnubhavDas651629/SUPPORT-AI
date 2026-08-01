from uuid import UUID
from sqlalchemy import ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.knowledge_base import KnowledgeBase
    from app.models.message import Message
    from app.models.ticket import Ticket

class Conversation(Base, UUIDMixin, TimestampMixin):
    __tablename__  = "conversations"
    __table_args__ = (
        Index("ix_conversations_org_created", "organization_id", "created_at"),
    )
    organization_id: Mapped[UUID] = mapped_column(ForeignKey("organizations.id"), nullable=False, index=True)
    knowledge_base_id:Mapped[UUID] = mapped_column(ForeignKey("knowledge_bases.id"), nullable=False)
    title: Mapped[str | None] = mapped_column(String(255), nullable= True)
    organization: Mapped["Organization"] = relationship(back_populates="conversations")
    knowledge_base: Mapped["KnowledgeBase"] = relationship(back_populates="conversations")
    messages: Mapped[list["Message"]] = relationship(back_populates="conversation", cascade="all, delete-orphan")
    ticket: Mapped["Ticket | None"] = relationship(back_populates="conversation")