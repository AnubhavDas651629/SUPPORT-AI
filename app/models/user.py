from sqlite3.dbapi2 import Timestamp
from time import timezone
from tokenize import String
from turtle import update
from uuid import UUID, uuid4
from sqlalchemy import Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from datetime import datetime, UTC
from sqlalchemy import Boolean, func, String

from app.models.organization_member import OrganizationMember
from app.models.mixins import TimestampMixin, UUIDMixin
from app.models.organization import Organization

class User(Base, TimestampMixin,UUIDMixin):
    __tablename__ = "users"
    email: Mapped[str] = mapped_column(String(255),unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    phone_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean,default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean,default=False, nullable=False)
    
    organization_member: Mapped[list["OrganizationMember"]] = relationship(back_populates="user")