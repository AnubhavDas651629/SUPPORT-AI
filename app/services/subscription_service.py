from app.exceptions.subscription import PlanLimitExceededException
from app.exceptions.subscription import FeatureNotAllowedException
from app.models import User
from app.models import OrganizationSubscription
from app.models import Organization
from app.repositories.subsciption_repository import SubscriptionRepository
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.base import BaseService
from uuid import UUID
from app.core.plan_config import PlanTier, PLAN_LIMITS
import stripe
from app.core.config import settings
from app.core.plan_config import PlanTier, SubscriptionStatus

stripe.api_key = settings.stripe_secret_key

class SubscriptionServices(BaseService):
    def __init__(self, session: AsyncSession):
        super().__init__(session)
        self.subscription_repository = SubscriptionRepository(session)

    async def get_or_create_subscription(self, *, organization_id: UUID) -> OrganizationSubscription:
        sub = await self.subscription_repository.get_by_organization_id(organization_id=organization_id)
        if not sub:
            sub = await self.subscription_repository.create_default_free_subscription(
                organization_id=organization_id
            )
            await self.session.commit()
        return sub

    async def check_feature_allowed(self, *, Organization_id:UUID, feature_flag: str, current_user:User) -> None:
        """Check if a boolean feature flag (eg allowed api keys) is enabled for the organization's plan"""
        await self._require_member(
            organization_id=Organization_id, 
            current_user=current_user
        )
        sub = await self.get_or_create_subscription(organization_id=Organization_id)
        limits = PLAN_LIMITS.get( 
            sub.plan_tier, PLAN_LIMITS[PlanTier.FREE]
        ) # is a safe way to read value from a dictionary, if a plan tier is not found for any reason we fall back to free tier

        """
        It checks: "Is this feature disabled for the organization's current plan?"
        On Free Tier: limits.get("allows_api_keys") returns False.
        not False evaluates to True → Block access & raise Exception! ❌
        On Pro Tier: limits.get("allows_api_keys") returns True.
        not True evaluates to False → Skip exception & allow access! ✅
        """
        if not limits.get(feature_flag, False):
            raise FeatureNotAllowedException(feature_name=feature_flag.replace("_", " ").title())

    async def check_quota_limit(self, *, organization_id:UUID, quota_key:str, current_count: int) -> None:
        """check if current usage counts exceeds the plan's mac limimt"""
        sub = await self.subscription_repository.get_by_organization_id(
            organization_id=organization_id
        )
        tier = sub.plan_tier if sub else PlanTier.FREE
        limits = PLAN_LIMITS.get(
            tier, 
            PLAN_LIMITS[PlanTier.FREE]
        )
        # quota key could be = "max_knowledge_base", "max_ai_responses_per_month"
        max_allowed = limits.get(quota_key, 0)
        if current_count >= max_allowed:
            raise PlanLimitExceededException(
                message = f"You have exceeded your {tier.value} plan limit of {max_allowed} for {quota_key}.Please upgrade your plan"
            )
