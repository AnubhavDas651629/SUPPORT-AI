from turtle import title
from uuid import UUID
from openai import organization
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models import knowledge_base, ticket
from app.models.mixins import TimestampMixin, UUIDMixin
from app.db.base import Base
from sqlalchemy import String
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.models.organization import Organization
if TYPE_CHECKING:
    from app.models.knowledge_base import KnowledgeBase
if TYPE_CHECKING: 
    from app.models.message import Message
if TYPE_CHECKING:
    from app.models.ticket import Ticket

class Conversation(Base, UUIDMixin, TimestampMixin):
    __tablename__  = "conversations"
    organization_id: Mapped[UUID] = mapped_column(ForeignKey("organizations.id"), nullable=False, index=True)
    knowledge_base_id:Mapped[UUID] = mapped_column(ForeignKey("knowledge_bases.id"), nullable=False)
    title: Mapped[str | None] = mapped_column(String(255), nullable= True)
    organization: Mapped["Organization"] = relationship(back_populates="conversations")
    knowledge_base: Mapped["KnowledgeBase"] = relationship(back_populates="conversations")
    messages: Mapped[list["Message"]] = relationship(back_populates="conversation", cascade="all, delete-orphan")
    ticket: Mapped["Ticket | None"] = relationship(back_populates="conversation")