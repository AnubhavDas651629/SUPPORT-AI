from datetime import datetime, UTC
from uuid import UUID
from sqlalchemy import func, select, update
from app.models.organization_usage import OrganizationUsage
from app.repositories.base import BaseRepository

class UsageRepository(BaseRepository):
    async def get_current_period(self, *, organization_id:UUID) -> OrganizationUsage | None:
        """
        Get the usage row for the org's current active billing period
        """
        now = datetime.now(UTC)
        stmt = (
            select(OrganizationUsage)
            .where(
                OrganizationUsage.organization_id == organization_id,
                OrganizationUsage.period_start <=now, 
                OrganizationUsage.period_end > now
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()


    async def create_for_period(self, *, 
    organization_id: UUID, 
    period_start: datetime, 
    period_end: datetime
    ) -> OrganizationUsage:
        """
        Creates a fresh usage row at the start of a new billing period(all counter = 0)
        """
        usage = OrganizationUsage(
            organization_id=organization_id,
            period_start=period_start,
            period_end=period_end,
            ai_responses_used=0,
            storage_bytes_used=0,
            conversations_started=0
        )
        self.session.add(usage)
        await self.session.flush()
        return usage

    #bytes added is the file size in bytes of a newly uploaded document
    async def increment_ai_response(self, *, organization_id:UUID) -> None:
        """
        Atomically add 1 to ai_responses_used for the current preiod
        """
        now = datetime.now(UTC)
        await self.session.execute(
            update(OrganizationUsage)
            .where(
                OrganizationUsage.organization_id == organization_id,
                OrganizationUsage.period_start <= now,
                OrganizationUsage.period_end > now
            )
        .values(ai_responses_used=OrganizationUsage.ai_responses_used + 1)
        )

    async def increment_storage(self, *, organization_id:UUID, bytes_added: int) -> None:
        """
        Atomically add fiel size bytes to storage_bytes_used
        """
        now = datetime.now(UTC)
        await self.session.execute(
            update(OrganizationUsage)
            .where(
                OrganizationUsage.organization_id == organization_id,
                OrganizationUsage.period_start <= now,
                OrganizationUsage.period_end > now
            )
            .values(storage_bytes_used = OrganizationUsage.storage_bytes_used + bytes_added)
        )

    async def decrement_storage(self, *, organization_id:UUID, bytes_removed:int) -> None:
        now = datetime.now(UTC)
        await self.session.execute(
            update(OrganizationUsage)
            .where(
                OrganizationUsage.organization_id == organization_id,
                OrganizationUsage.period_start <= now,
                OrganizationUsage.period_end > now
            )
            .values(storage_bytes_used=func.greatest(0, OrganizationUsage.storage_bytes_used - bytes_removed)) #Postgres GREATEST(x,0) = clamp to 0
        )


    async def increment_conversation(self, *, organization_id:UUID) -> None:
        """Atomically add 1 to connversations_started"""
        now = datetime.now(UTC)
        await self.session.execute(
            update(OrganizationUsage)
            .where(
                OrganizationUsage.organization_id == organization_id,
                OrganizationUsage.period_start <= now,
                OrganizationUsage.period_end > now
            )
            .values(conversations_started = OrganizationUsage.conversations_started + 1)
        )

