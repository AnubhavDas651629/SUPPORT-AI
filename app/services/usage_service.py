from datetime import datetime
from app.exceptions.subscription import PlanLimitExceededException
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
        using the subscriptions preiod dates
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


# AI RESPONSES 
    
    async def check_ai_quota(self, *, organization_id:UUID) -> None:
        usage = await self._get_or_create_usage(
            organization_id=organization_id
        )
        limits = await self._get_plan_limits(
            organization_id=organization_id
        )
        max_responses = limits.get("max_ai_reponses_per_month", 0)

        if usage.ai_responses_used >= max_responses:
            raise PlanLimitExceededException(
                message=f"You have used all {max_responses} AI responses for this month. Please upgrade your plan"
            )

    async def record_ai_response(self, *, organization_id: UUID) -> None:
        """Increment the AI response counter by 1 after a successful response."""
        # 1. Guarantee the row exists in DB for this period
        await self._get_or_create_usage(
            organization_id=organization_id
        )
        # 2. Atomically increment in Postgres
        await self.usage_repository.increment_ai_response(
            organization_id=organization_id
        )
        await self.session.commit()

#STORAGE

    async def check_storage_quota(self, *, organization_id: UUID, new_bytes: int) -> None:
        usage = await self._get_or_create_usage(
            organization_id=organization_id
        )
        limits = await self._get_plan_limits(
            organization_id=organization_id
        )
        max_bytes = limits.get("max_storage_bytes", 0)
        if (usage.storage_bytes_used + new_bytes) > max_bytes:
            max_mb = max_bytes / (1024 * 1024)
            raise PlanLimitExceededException(
                message = f"Storage limit of {max_mb:.0f} MB reached/ Please upgrade your plan"
            )

    async def record_storage_added(self, *, organization_id:UUID, bytes_added:int)-> None:
        """
        Increment storage counter after a successfull upload
        """
        await self._get_or_create_usage(
            organization_id=organization_id
        )
        await self.usage_repository.increment_storage(
            organization_id=organization_id,
            bytes_added=bytes_added
        )
        await self.session.commit()

    async def record_storage_removed(self, *, organization_id: UUID, bytes_removed:int) -> None:
        """
        Decrement storage counter when a document is deleted
        """
        await self.usage_repository.decrement_storage(
            organization_id=organization_id,
            bytes_removed=bytes_removed
        )
        await self.session.commit()

# CONVERSATIONS

    async def record_conversation_started(self, *, organization_id:UUID)-> None:
        """
        Increment conversation counter when a new conversation is created
        """
        await self._get_or_create_usage(
            organization_id=organization_id
        )
        await self.usage_repository.increment_conversation(
            organization_id=organization_id
        )
        await self.session.commit()

# PERIOD RESET

    async def reset_for_new_period(
        self, *, 
        organization_id: UUID,
        period_start: datetime,
        period_end: datetime
    ) -> None:
        """
        Called from stripe webhook when a subscription renews
        Creates a brand new usage row with all coutners at 0
        The old row stays at the db as a historical record
        """
        await self.usage_repository.create_for_period(
            organization_id=organization_id,
            period_start=period_start,
            period_end=period_end
        )
        await self.session.commit()


# USAGE DASHBORAD

    async def get_usage_summary(self, *, organization_id:UUID) -> dict:
        """
        will return current usage vs Limits -used by the dashboard API
        """
        usage = await self._get_or_create_usage(
            organization_id=organization_id
        )
        limits = await self._get_plan_limits(
            organization_id=organization_id
        )
        return{
            "period_start": usage.period_start,
            "period_end": usage.period_end,
            "ai_responses": {
                "used": usage.ai_responses_used,
                "limit": limits.get("max_ai_responses_per_month")
            },
            "storage_bytes":{
                "used": usage.storage_bytes_used,
                "limit": limits.get("max_storage_bytes")
            },
            "conversations":{
                "used": usage.conversations_started
            }
        }

