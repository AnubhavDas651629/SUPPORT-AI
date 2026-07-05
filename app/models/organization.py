from sqlalchemy import String, null
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.knowledge_base import KnowledgeBase
from app.models.organization_member import OrganizationMember


from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDMixin

class Organization(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "organizations"
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    member: Mapped[list["OrganizationMember"]] = relationship(back_populates="organization")
    knowledge_bases: Mapped[list["KnowledgeBase"]] = relationship(back_populates="organization", cascade="all, delete-orphan")