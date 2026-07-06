from enum import Enum
from uuid import UUID

from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey, Integer
from sqlalchemy import Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models import knowledge_base
from app.models.mixins import TimestampMixin, UUIDMixin
from app.db.base import Base
from sqlalchemy import String

if TYPE_CHECKING:
    from app.models.knowledge_base import KnowledgeBase

class DocumentStatus(str, Enum):
    UPLOADING = "UPLOADING"
    PROCESSING = "PROCESSING"
    READY = "READY"
    FAILED = "FAILED"

class Document(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "documents"
    knowledge_base_id: Mapped[UUID] = mapped_column(ForeignKey("knowledge_bases.id"), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_key:Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(255), nullable=False) 
    size: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[DocumentStatus] = mapped_column(SQLEnum(DocumentStatus), default=DocumentStatus.UPLOADING, nullable=False)
    extension: Mapped[str] = mapped_column(String(255), nullable=False)

    knowledge_base: Mapped["KnowledgeBase"] = relationship(back_populates="documents" )

