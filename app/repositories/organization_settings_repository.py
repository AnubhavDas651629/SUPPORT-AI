from uuid import UUID
from sqlalchemy import select
from app.models.organization_setting import OrganizationSettings
from app.repositories.base import BaseRepository

class OrganizationSettingsRepository(BaseRepository):
    async def get_by_organization_id(self, *, organization_id:UUID) -> OrganizationSettings | None:
        """
        Get the settings for this org
        """
        stmt = (
            select(OrganizationSettings)
            .where(
                OrganizationSettings.organization_id == organization_id
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_default(self, *, organization_id: UUID) -> OrganizationSettings:
        """
        Create settings with defaults the first time an org accessed them
        This is like get_or_create_subscription — runs once, then the row exists forever
        """
        settings = OrganizationSettings(
            organization_id=organization_id,
            primary_color="#4F46E5",
            widget_title="Support Assistant",
            temperature=0.7,
            auto_create_ticket_on_escalation=True
        )
        self.session.add(settings)
        await self.session.flush()
        return settings

    async def update(self, *, settings: OrganizationSettings, update_data: dict):
        """
        Apply a dict of changed fields to the settings object
        Only updates fields that were actaully provided(partial patch)
        """
        for field, value in update_data.items():
            setattr(settings, field, value)
        await self.session.flush()
        return settings