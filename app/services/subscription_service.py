from datetime import UTC
from datetime import datetime
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

STRIPE_PRICE_TO_PLAN: dict[str, PlanTier] = {
    settings.stripe_pro_price_id: PlanTier.PRO,
    settings.stripe_enterprise_price_id: PlanTier.ENTERPRISE,
}


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
        not False evaluates to True → Block access & raise Exception! 
        On Pro Tier: limits.get("allows_api_keys") returns True.
        not True evaluates to False → Skip exception & allow access! 
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


    async def create_checkout_session(
        self, 
        *, 
        organization_id:UUID, 
        price_id: str, 
        success_url:str,
        cancel_url:str
    ) -> str:
        """
        Creates a stripe checkout session and returns url, the user is directed 
        there to enter their card details
        stripe will handle the rest, we will give it the price and redirect urls
        """
        sub = await self.get_or_create_subscription(
            organization_id=organization_id
        )
        # if org already has a stripe account, reuse it
        #otherwise stripe will create a new one during checkout
        customer_id = sub.stripe_customer_id

        session = stripe.checkout.Session.create(
            mode="subscription",
            line_items = [{"price": price_id, "quantity": 1}],
            success_url=success_url,
            cancel_url=cancel_url,
            customer=customer_id, # None is fine stripe creates a new customer
            metadata= {"organization_id": str(organization_id)} # we"ll read this in the webhook
        )
        return session.url

    async def create_portal_session(
        self, *, organization_id: UUID, return_url:str
    ) -> str:
        """
        Creates a stripe billing portal session and returns the URL
        User is redirected there to manage/cancel their subscription
        requires the org to already have a stripe_customer_id
        ***Stripe id(both customer_id and subscription_id) id NULL until first checkout is done***
        """
        sub = await self.get_or_create_subscription(
            organization_id=organization_id
        )
        if not sub.stripe_customer_id:
            raise ValueError("This organization has no Stripe customer. They must subscribe first.")
        
        session = stripe.billing_portal.Session.create(
            customer=sub.stripe_customer_id,
            return_url=return_url
        )
        return session.url

    async def handle_webhook_event(self, *, payload:bytes, sig_header: str) -> None:
        """
        Verifies the strip webhook signature and processees the event

        webhook -> when somthing happens in strip(payment succeeded, sub cancelled) stripe sends an HTTP post req to our server at /stripe/webhook and sends a JSON body
        when stripe sends the webhook it also adds a special HTTP header:
        stripe-signature: t=1723456789,v1=a1b2c3d4e5f6...,v1=another_hash
        t -> timestampt of whne strip sent the req
        v1 -> HMAC-SHA 256 hash of that stripe computed using:
        HMAC_SHA256(key=your_webhook_secret, message="{timestamp}.{raw_body}")


        This is the function that actually upgrades/downgrades/cancels plan
        NEVER trust payload without verifying the signature first
        If the signature check fails, stripe raises an exception, we let it propogate
        """
        event = stripe.Webhook.construct_event(
            payload=payload, 
            sig_header=sig_header,
            secret=settings.stripe_webhook_sercret
        )

        event_type = event["type"]
        data = event["data"]["object"]


        #When a user completes payment on Stripe's checkout page, Stripe fires "checkout.session.completed" at your webhook
        """
        Here's what is in the data object at that moment:
        data = {
            "metadata": { "organization_id": "uuid-you-sent-when-creating-session" },
            "customer": "cus_abc123",      ← Stripe's permanent ID for this org
            "subscription": "sub_xyz789",  ← the subscription they just paid for
            ...
        }
        """
        if event_type == "checkout.session.completed":
            #first time payment, stripe gives us the customer + subscription id's
            # the actual plan update comes from "customer.subscription.created" below,
            # but we save the customer_id here using the organization_id from metadata
            org_id = data["metadata"].get("organization_id")
            customer_id = data["customer"]
            subscription_id = data["subscription"]
            
            if org_id:
                sub = await self.subscription_repository.get_by_organization_id(
                    organization_id=UUID(org_id)
                )
                if sub:
                    sub.stripe_customer_id = customer_id
                    sub.stripe_subscription_id = subscription_id
                    await self.session.commit()

        elif event_type in ("customer.subscription.created", "customer.subscription.updated"):
            # this fires when a subscription is created OR when plan changes/ renews
            # This is where we actually update the plan tier
            customer_id = data["customer"]
            price_id = data["items"]["data"][0]["price"]["id"]
            period_end = data["current_period_end"]
            status = data["status"] #active, "past_due", "cancelled"

            sub = await self.subscription_repository.get_by_stripe_id(
                stripe_customer_id=customer_id,
            )
            if sub:
                sub.plan_tier = STRIPE_PRICE_TO_PLAN.get(
                    price_id,
                    PlanTier.FREE
                )
                sub.stripe_subscription_id = data["id"]
                sub.current_period_end = datetime.fromtimestamp(period_end, tz = UTC)
                sub.status = SubscriptionStatus.ACTIVE if status== "active" else SubscriptionStatus.PAST_DUE
                await self.session.commit()

        elif event_type == "customer.subscription.deleted":
            #user cancelled, downgraed the free tier
            customer_id = data["customer"]
            sub = await self.subscription_repository.get_by_stripe_id(
                stripe_customer_id=customer_id
            )
            if sub:
                sub.plan_tier = PlanTier.FREE
                sub.stripe_subscription_id = None
                sub.status = SubscriptionStatus.CANCELED
                await self.session.commit()

        elif event_type == "invoice.payment_failed":
            #card declined, mark as past_due
            customer_id = data["customer"]
            sub = await self.subscription_repository.get_by_stripe_id(
                stripe_customer_id=customer_id
            )
            if sub:
                sub.status = SubscriptionStatus.PAST_DUE
                await self.session.commit()



