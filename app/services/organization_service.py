from slugify import slugify
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import organization
from app.models.organization_member import OrganizationRole
from app.models.user import User
from app.repositories.organization_member_repository import OrganizationMemberRepository
from app.repositories.organization_repository import OrganizationRepository

class OrganizationService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.organization_repository = OrganizationRepository(
            session
        )      
        self.membership_repository = (
            OrganizationMemberRepository(session)
        )  

    async def create(self, *, current_user: User, name: str):
        slug = slugify(name)

        organization = await self.organization_repository.create(
            name=name,
            slug=slug,
        )
        await self.membership_repository.create(
            organization_id=organization.id,
            user_id=current_user.id,
            role=OrganizationRole.OWNER,
        )
        await self.session.commit()
        return organization
