from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
from app.core.plan_config import PlanTier, SubscriptionStatus

class PlanLimitsResponse(BaseModel):
    max_ai_responses_per_month: int
    max_knowledge_bases: int
    max_documents_per_kb: int
    max_members: int
    max_storage_bytes: int
    allows_api_keys: bool
    allows_webhooks: bool
    allows_custom_branding: bool

class SubscriptionResponse(BaseModel):
    id: UUID
    organization_id: UUID
    plan_tier: PlanTier
    status: SubscriptionStatus
    current_period_start: datetime
    current_period_end: datetime
    limits: PlanLimitsResponse
