from app.core.plan_config import PLAN_LIMITS
from app.core.plan_config import PlanTier
from app.processing.tasks import document_tasks
from app.processing.tasks import document_tasks
from app.models import OrganizationUsage
from app.models import Organization
from app.repositories.subsciption_repository import SubscriptionRepository
from app.repositories.usage_repository import UsageRepository
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.base import BaseService
from uuid import UUID


class UsageService(BaseService):
    def __init__(self, session: AsyncSession):
        super().__init__(session)
        self.usage_repository = UsageRepository(session)
        self.subscription_repository = SubscriptionRepository(session)

    async def _get_or_create_usage(
        self, *, organization_id:UUID
    ) -> OrganizationUsage:
        """
        Gets the current period usage row
        if it doesn't exist yet(eg org just created now)
        using the subscription;s preiod dates
        """
        usage = await self.usage_repository.get_current_period(
            organization_id=organization_id
        )
        if not usage:
            sub = await self.subscription_repository.get_by_organization_id(
                organization_id=organization_id
            )
            if sub:
                usage = await self.usage_repository.create_for_period(
                    organization_id=organization_id,
                    period_start=sub.current_period_start,
                    period_end=sub.current_period_end
                )
                await self.session.commit()
        return usage

    async def _get_plan_limits(self, *, organization_id:UUID) -> dict:
        """
        Returns the pla limits for the org's current tier
        """
        sub = await self.subscription_repository.get_by_organization_id(
            organization_id=organization_id
        )
        tier = sub.plan_tier if sub else PlanTier.FREE
        return PLAN_LIMITS.get(tier, PLAN_LIMITS[PlanTier.FREE])