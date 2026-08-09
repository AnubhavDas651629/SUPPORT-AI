from uuid import UUID
from typing import TYPE_CHECKING
from sqlalchemy import Boolean, Float, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.organization import Organization


class OrganizationSettings(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "organization_settings"

    __table_args__ = (
        #this will ensure one org has only one settings table(as it should)
        #name is just the row name for this constraint, if we don't give it on our own, postgres will
        UniqueConstraint("organization_id", name="uq_org_settings"),
    )

    organization_id: Mapped[UUID] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )

    # Branding
    company_logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    primary_color: Mapped[str] = mapped_column(String(7), default="#4F46E5", nullable=False)
    widget_title: Mapped[str] = mapped_column(String(100), default="Support Assistant", nullable=False)


    #AI configuration
    #onwer writes instrcutions over here e.g:"always be formal and mention refund policy")
    system_prompt_override: Mapped[str | None] = mapped_column(Text, nullable=True)
    #0.0 = strictly factual and 1.0 = creative, passed directly to openai
    temperature: Mapped[float] = mapped_column(Float, default=0.7, nullable=False)

    #Escalation
    support_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    #when true, a DB ticket is auto-created whenever AI escalates
    auto_create_ticket_on_escalation: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    organization: Mapped["Organization"] = relationship("Organization", backref="settings")


    

