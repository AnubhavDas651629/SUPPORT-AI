from enum import Enum

class PlanTier(str, Enum):
    FREE = "FREE"
    PRO = "PRO"
    ENTERPRISE = 'ENTERPRISE'

class SubscriptionStatus(str, Enum):
    ACTIVE = "ACTIVE"
    PAST_DUE = "PAST_DUE"
    CANCELED = "CANCELED"
    TRIALING = "TRIALING"

PLAN_LIMITS = {
    PlanTier.FREE: {
        "max_ai_responses_per_month": 100,
        "max_ai_tokens_per_month": 100_000,
        "max_knowledge_bases": 1,
        "max_documents_per_kb": 10,
        "max_members": 1,
        "max_storage_bytes": 100 * 1024 * 1024,  # 100 MB
        "allows_api_keys": False,
        "allows_webhooks": False,
        "allows_custom_branding": False,
    },
    PlanTier.PRO: {
        "max_ai_responses_per_month": 10000,
        "max_ai_tokens_per_month": 10_000_000,
        "max_knowledge_bases": 10,
        "max_documents_per_kb": 500,
        "max_members": 10,
        "max_storage_bytes": 10 * 1024 * 1024 * 1024,  # 10 GB
        "allows_api_keys": True,
        "allows_webhooks": True,
        "allows_custom_branding": True,
    },
    PlanTier.ENTERPRISE: {
        "max_ai_responses_per_month": 500000,
        "max_ai_tokens_per_month": 500_000_000,
        "max_knowledge_bases": 100,
        "max_documents_per_kb": 10000,
        "max_members": 100,
        "max_storage_bytes": 500 * 1024 * 1024 * 1024,  # 500 GB
        "allows_api_keys": True,
        "allows_webhooks": True,
        "allows_custom_branding": True,
    },
}