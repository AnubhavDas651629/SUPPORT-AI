from sqlite3.dbapi2 import Timestamp
from time import timezone
from tokenize import String
from turtle import update
from uuid import UUID, uuid4
from sqlalchemy import Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base
from datetime import datetime, UTC
from sqlalchemy import Boolean, func, String

from app.models.mixins import TimestampMixin, UUIDMixin

class User(Base, TimestampMixin,UUIDMixin):
    __tablename__ = "users"
    id: Mapped[UUID] = mapped_column(default=uuid4, primary_key=True)
    email: Mapped[str] = mapped_column(String(255),unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    phone_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean,default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean,default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(),nullable=False)
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now(), nullable=False)