from datetime import datetime
from uuid import UUID
from typing import TYPE_CHECKING
from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.organization import Organization


class ApiKey(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "api_keys"

    __table_args__ = (
        # Index on key_hash for O(1) lookup on every API request
        #suppose there are 100,000 api keys saved then index will not search through all 100k one by one for a specific one but rahter jump on the required key
        Index("ix_api_keys_key_hash", "key_hash"),
    )

    organization_id: Mapped[UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )

    # Human-readable label set by the owner e.g. "Production Server" or "Shopify Widget"
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    # Displayed in dashboard so user can identify which key is which (never the full key)
    key_prefix: Mapped[str] = mapped_column(String(30), nullable=False)

    # SHA-256 hash of the raw key — this is what we look up on every API call
    key_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)

    # Setting to False immediately revokes access without deleting the record
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Updated every time this key is successfully used — useful for auditing unused keys
    last_used_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Optional: keys can be set to auto-expire
    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    organization: Mapped["Organization"] = relationship("Organization", backref="api_keys")
