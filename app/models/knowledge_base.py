from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models import organization
from app.models.mixins import UUIDMixin, TimestampMixin
from app.db.base import Base
from uuid import UUID
from sqlalchemy import String, Text
from app.models.organization import Organization

class KnowledgeBase(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "Knowledge Bases"
    organization_id: Mapped[UUID] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=False)
    organization: Mapped["Organization"] = relationship(back_populates="knowledge_bases")