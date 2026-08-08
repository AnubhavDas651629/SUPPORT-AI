from datetime import datetime
from uuid import UUID
from typing import TYPE_CHECKING
from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.organization import Organization


class OrganizationUsage(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "organization_usage"

    __table_args__ = (
        # Trailing comma is required so Python treats this as a tuple!
        UniqueConstraint("organization_id", "period_start", name="uq_org_usage_period"),
    )

    organization_id: Mapped[UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )

    # Billing period -> copied from the subscription at reset time
    period_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    period_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # counters -> incremented atomically as events happen
    ai_responses_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    storage_bytes_used: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    conversations_started: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    organization: Mapped["Organization"] = relationship("Organization", backref="usage_records")