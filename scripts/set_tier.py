import asyncio
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from uuid import UUID
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.organization import Organization
from app.core.plan_config import PlanTier
from app.services.subscription_service import SubscriptionServices


async def main():
    if len(sys.argv) < 2:
        print("Usage: uv run python scripts/set_tier.py <ORG_NAME_OR_ID> [FREE|PRO|ENTERPRISE]\n")
        print("Current Organizations & Plans:")
        async with AsyncSessionLocal() as session:
            orgs = (await session.execute(select(Organization))).scalars().all()
            svc = SubscriptionServices(session=session)
            for org in orgs:
                sub = await svc.get_or_create_subscription(organization_id=org.id)
                print(f"  • {org.name} (ID: {org.id}) ➔ Plan: {sub.plan_tier.value}")
        return

    target = sys.argv[1].strip()
    tier_input = (sys.argv[2] if len(sys.argv) > 2 else "PRO").upper().strip()

    if tier_input not in [PlanTier.FREE.value, PlanTier.PRO.value, PlanTier.ENTERPRISE.value]:
        print(f"Error: Invalid tier '{tier_input}'. Must be FREE, PRO, or ENTERPRISE.")
        return

    target_tier = PlanTier(tier_input)

    async with AsyncSessionLocal() as session:
        # Search by UUID or by Name
        org = None
        try:
            org_uuid = UUID(target)
            org = await session.get(Organization, org_uuid)
        except ValueError:
            pass

        if not org:
            org = (await session.execute(select(Organization).where(Organization.name.ilike(target)))).scalar_one_or_none()

        if not org:
            print(f"Error: Organization '{target}' not found.")
            return

        svc = SubscriptionServices(session=session)
        sub = await svc.get_or_create_subscription(organization_id=org.id)
        old_tier = sub.plan_tier.value
        sub.plan_tier = target_tier
        await session.commit()

        print(f"✅ Successfully changed '{org.name}' tier: {old_tier} ➔ {target_tier.value}")


if __name__ == "__main__":
    asyncio.run(main())
