from enum import Enum
from uuid import UUID

from sqlalchemy import Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.api.v1 import users
from app.db.base import Base
from app.models import organization
from app.models.mixins import TimestampMixin

class OrganizationRole(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"

class OrganizationMember(Base, TimestampMixin):
    __tablename__ = "organization_members"

    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), primary_key=True)
    organization_id: Mapped[UUID] = mapped_column(ForeignKey("organizations.id"), primary_key=True)
    role: Mapped[OrganizationRole] = mapped_column(SQLEnum(OrganizationRole), default=OrganizationRole.MEMBER, nullable=False)


