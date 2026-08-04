from datetime import timedelta
from app.core.plan_config import SubscriptionStatus
from app.core.plan_config import PlanTier
from datetime import UTC
from datetime import datetime
from numpy import select
from app.models.subscription import OrganizationSubscription
from uuid import UUID
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