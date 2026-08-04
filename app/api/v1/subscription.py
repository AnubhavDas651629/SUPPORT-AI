from openai.types.shared import responses_model
from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.dependencies import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.subscription import SubscriptionResponse, PlanLimitsResponse
from app.services.subscription_service import SubscriptionService
from app.core.plan_config import PLAN_LIMITS, PlanTier


router = APIRouter(
    prefix="/organizations/{organization_id}/subscription",
    tags=["Subscriptions"]
)

@router.get("", response_model=SubscriptionResponse)
async def get_subscription(
    organization_id: UUID,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = SubscriptionService(session=session)
    sub = await service.get_or_create_subscription(
        organization_id=organization_id
    )
    tier_limits = PLAN_LIMITS.get(
        sub.plan_tier, PLAN_LIMITS[PlanTier.FREE]
    )

    return SubscriptionResponse(
        id = sub.id,
        organization_id=sub.organization_id,
        plan_tier=sub.plan_tier,
        status=sub.status,
        current_period_start=sub.current_period_start,
        current_period_end=sub.current_period_end,
        limits=PlanLimitsResponse(**tier_limits)
    )