from app.core.plan_config import SubscriptionStatus
from app.core.plan_config import PlanTier
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.mixins import TimestampMixin
from app.models.mixins import UUIDMixin
from app.db.base import Base
from datetime import datetime, UTC
from uuid import UUID
from typing import TYPE_CHECKING
from sqlalchemy import DateTime, Enum as SQLEnum, ForeignKey, String

if TYPE_CHECKING:
    from app.models.organization import Organization


class OrganizationSubscription(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "organization_subscription"

    organization_id: Mapped[UUID] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, unique=True),
    plan_tier: Mapped[PlanTier] = mapped_column(SQLEnum(PlanTier), default = PlanTier.FREE, nullable=False)
    status: Mapped[SubscriptionStatus] = mapped_column(SQLEnum(SubscriptionStatus), default=SubscriptionStatus.ACTIVE, nullable=False)
    current_preiod_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    current_period_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    #stripe indetifiers
    stripe_customer_id: Mapped[str|None] = mapped_column(String(255), nullable=False)
    stripe_subscription_id: Mapped[str|None] = mapped_column(String(255), nullable=False)
    organization: Mapped["Organization"] = relationship("Organization", backref="subscription")

