from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.mixins import UUIDMixin, TimestampMixin
from app.db.base import Base
from uuid import UUID
from sqlalchemy import String, Text
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.organization import Organization
    
if TYPE_CHECKING:
    from app.models.document import Document

if TYPE_CHECKING:
    from app.models.conversation import Conversation

class KnowledgeBase(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "knowledge_bases"
    organization_id: Mapped[UUID] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=False)
    organization: Mapped["Organization"] = relationship(back_populates="knowledge_bases")
    documents: Mapped[list["Document"]] = relationship(back_populates="knowledge_base", cascade="all, delete-orphan")
    conversations: Mapped[list["Conversation"]] = relationship(back_populates="knowledge_base")