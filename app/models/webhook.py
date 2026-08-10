from typing import TYPE_CHECKING
from uuid import UUID
from sqlalchemy import (
    Boolean, ForeignKey, Index, Integer, String, Text
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.mixins import TimestampMixin, UUIDMixin
if TYPE_CHECKING:
    from app.models.organization import Organization

"""
Webhook endpoints are like 1 url for slack and 1 for zapier
now each wendpoint will recieve 100's of post request
those requests would be stored at webhook delivery
"""

class WebhookEndpoint(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "webhook_endpoints"
    __table_args__ = (
        # find all active endpoints for this org
        Index("ix_webhook_endpoints_org_id", "organization_id"),
    )
    organization_id: Mapped[UUID] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(100),nullable=False) #human labels, eg slack alerts
    url: Mapped[str] = mapped_column(String(500), nullable=False) #customer's url that support ai will post to 
    secret_encrypted: Mapped[str] = mapped_column(Text, nullable=False) #AES fernet encrypted signing secret, customer copies this value once from dashboard and stores it in their .EnvironmentError
    subscribed_events: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list) # ticket.created, ticket.resolved
    is_active: Mapped[bool] = mapped_column(Integer, default=True, nullable=False)
    consecutive_failures: Mapped[int] = mapped_column(Integer, name="consecutive_failure", default=0, nullable=False) #how many consecutive times delivery failure
    
    organization: Mapped["Organization"] = relationship("Organization", backref="webhook_endpoints")
    deliveries: Mapped[list["WebhookDelivery"]] = relationship("WebhookDelivery", back_populates="endpoint", lazy="select", order_by="WebhookDelivery.created_at.desc()")


class WebhookDelivery(Base, UUIDMixin, TimestampMixin):
    __tablename__ ="webhook_deliveries"
    """
    One log record per delivery attempt
    customers can view these logs to debug why their server didn't recieve events
    """
    __table_args__=(
        Index("ix_webhook_deliveries_endpoint_id", "endpoint_id"),
    )

    endpoint_id: Mapped[UUID] = mapped_column(ForeignKey("webhook_endpoints.id", ondelete="CASCADE"), nullable=False)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False) #ticket.created
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False) #full payload we sent
    status_code: Mapped[int | None] = mapped_column(Integer, nullable=True) # HTTP response code we recieved(null = timeout / network error)
    response_body: Mapped [str | None] = mapped_column(Text, nullable=True) # if our payload reaches it might return "ok" or {"recieved": true} and if it fails some other msg
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True) #how long req took in miliseconds
    is_success: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False) # true for status code 2xx
    attempt_number: Mapped[int] = mapped_column(Integer, default=1, nullable=False) # 1 = first attempt, 2 = first retry

    endpoint: Mapped["WebhookEndpoint"] = relationship("WebhookEndpoint", back_populates="deliveries")

