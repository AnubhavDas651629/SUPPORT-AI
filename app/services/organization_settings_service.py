from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.repositories.organization_settings_repository import OrganizationSettingsRepository
from app.services.base import BaseService
from app.services.subscription_service import SubscriptionServices
from app.models.organization_setting import OrganizationSettings

#BRANDIND field for the pro/enterprise
BRANDING_FIELDS = {"company_logo_url", "primary_color", "widget_title"}

class OrganizationSettingsService(BaseService):
    def __init__(self, session: AsyncSession):
        super().__init__(session)
        self.settings_repository = OrganizationSettingsRepository(session)
        self.subscription_service = SubscriptionServices(session)

    async def get_or_create_settings(self, *, organization_id:UUID) -> OrganizationSettings:
        """
        Gets the settings row for this org
        if for the first tiem creates the default row
        """
        settings = await self.settings_repository.get_by_organization_id(
            organization_id=organization_id
        )
        if not settings:
            settings = await self.settings_repository.create_default(
                organization_id=organization_id
            )
            await self.session.commit()
        return settings

    async def get_settings(
        self, *, organization_id: UUID, current_user: User) -> OrganizationSettings:
        """
        Any member of the org can view settings (needed to render the widget)
        """
        await self._require_member(
            organization_id=organization_id,
            current_user=current_user
        )
        return await self.get_or_create_settings(organization_id=organization_id)

    async def update_settings(self, *, organization_id:UUID, current_user:User, update_data:dict) -> OrganizationSettings:
        """
        Only org owners can change this settings
        """
        await self._require_owner(
            organization_id=organization_id,
            current_user=current_user
        )
        #check if the owner is trying to change brancding fields
        #if so their plan must have "allow_custom_branding" = True
        """
        In Python, .intersection() finds the common items between two collections. It answers: "Did the owner send ANY field that belongs to the restricted branding list?"

        Scenario A: Owner only changes the AI Temperature
        update_data.keys() = {"temperature"}
        Intersection with BRANDING_FIELDS = set() (Empty!)
        if requested_branding_fields: evaluates to False ➔ Free Tier users are allowed to change temperature without any error!
        
        Scenario B: Owner tries to change their Logo & Color
        update_data.keys() = {"primary_color", "temperature"}
        Intersection with BRANDING_FIELDS = {"primary_color"} (Found one!)
        if requested_branding_fields: evaluates to True ➔ Triggers the plan check below!

        """
        requested_branding_fields = BRANDING_FIELDS.intersection(update_data.keys())
        if requested_branding_fields:
            await self.subscription_service.check_feature_allowed(
                Organization_id=organization_id,
                feature_flag="allows_custom_branding",
                current_user=current_user,
            )
        settings = await self.get_or_create_settings(
            organization_id=organization_id
        )

        # Only pass non-None fields from the PATCH request
        # This means the owner can update just temperature without touching branding
        """
        This is a Python dictionary comprehension that cleans up the data.

        If update_data is:
        python
        {"temperature": 0.4, "support_email": None, "company_logo_url": None}
        fields_to_update filters it down to:
        python
        {"temperature": 0.4}
        This guarantees that missing fields don't accidentally overwrite existing database columns with None!
        and that is stays on default

        """
        fields_to_update = {k: v for k, v in update_data.items() if v is not None}

        updated = await self.settings_repository.update(
            settings=settings,
            update_data=fields_to_update,
        )
        await self.session.commit()
        return updated

    

