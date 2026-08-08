from app.models import OrganizationMember
from datetime import timedelta, datetime, UTC
from uuid import UUID
from sqlalchemy import select

from app.core.plan_config import SubscriptionStatus, PlanTier
from app.models.subscription import OrganizationSubscription
from app.repositories.base import BaseRepository
class SubscriptionRepository(BaseRepository):
    async def get_by_organization_id(self, *, organization_id:UUID) -> OrganizationSubscription | None:
        stmt = (
            select(OrganizationSubscription)
            .where(
                OrganizationSubscription.organization_id == organization_id
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_default_free_subscription(self, *, organization_id:UUID) -> OrganizationSubscription:
        now = datetime.now(UTC)
        subscription = OrganizationSubscription(
            organization_id=organization_id,
            plan_tier=PlanTier.FREE,
            status=SubscriptionStatus.ACTIVE,
            current_period_start=now, 
            current_period_end=now + timedelta(days=3650), #10 years free
        )
        self.session.add(subscription)
        await self.session.flush()
        return subscription

    async def get_by_stripe_id(self, *, stripe_customer_id: str) -> OrganizationSubscription | None:
        stmt = (
            select(OrganizationSubscription)
            .where(OrganizationSubscription.stripe_customer_id == stripe_customer_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()