from uuid import UUID
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.functions import current_user
from app.exceptions.auth import PermissionDeniedException
from app.exceptions.organization import OrganizationNotFoundException
from app.models import knowledge_base
from app.models.knowledge_base import KnowledgeBase
from app.models.user import User
from app.models.organization_member import OrganizationMember
from app.schemas.member import OrganizationRole
from app.repositories.knowledge_base_repository import KnowledgeBaseRepository
from app.repositories.organization_member_repository import OrganizationMemberRepository
from app.repositories.organization_repository import OrganizationRepository


class KnowledgeBaseService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.knowledge_base_repository = KnowledgeBaseRepository(session)
        self.organization_repository = OrganizationRepository(session)
        self.membership_repository = OrganizationMemberRepository(session)
    
    
    async def _require_owner(self, *, organization_id:UUID, current_user: User) -> OrganizationMember:
        organization = await self.organization_repository.get_by_id_for_user(
            organization_id=organization_id,
            user_id=current_user.id
        )
        if organization is None:
            raise OrganizationNotFoundException()

        # if this function returns org this means we have identified the org and the current user is a part of the org, now in order to invite, next step is to check the role of the current user, that decides he they can invite a person
        #the purpose of defining membership is just because the return of this will have the role attribute which we need
        membership = await self.membership_repository.get_membership(
            organization_id=organization_id,
            user_id=current_user.id,
        )
        if (membership is None or membership.role != OrganizationRole.OWNER):
            raise PermissionDeniedException()

        return membership


    async def _require_member(self, *, organization_id:UUID, current_user:User) -> OrganizationMember:
        organization = await self.organization_repository.get_by_id_for_user(
            organization_id=organization_id,
            user_id=current_user.id
        )
        if organization is None:
            raise OrganizationNotFoundException()

        membership = await self.membership_repository.get_membership(
            organization_id=organization_id,
            user_id=current_user.id,
        )
        if membership is None:
            raise PermissionDeniedException()
        return membership

    async def create(self, *, organization_id: UUID, current_user: User, name: str, description: str | None ) -> KnowledgeBase:
        await self._require_owner(
            organization_id=organization_id,
            current_user=current_user
        )
        existing = await self.knowledge_base_repository.get_by_name_for_organization(
            organization_id=organization_id,
            knowledge_base_name=name
        )
        if existing is not None:
            raise KnowledgeBaseAlreadyExistsException()

        knowledge_base = await self.knowledge_base_repository.create(
            organization_id=organization_id,
            name=name,
            description=description
        )
        await self.session.commit()
        return knowledge_base

    async def list_for_organization(self, *, organization_id: UUID,current_user:User) -> list[KnowledgeBase]:
        await self._require_member(
            organization_id=organization_id,
            current_user=current_user
        )
        return await self.knowledge_base_repository.list_for_organization(
            organization_id=organization_id
        )

    async def get_by_id(self, *, organization_id: UUID, current_user: User, knowledge_base_id: UUID) -> KnowledgeBase:
        await self._require_member(
            organization_id=organization_id,
            current_user=current_user
        )
        knowledge_base = await self.knowledge_base_repository.get_by_id_for_organization(
            organization_id=organization_id,
            knowledge_base_id=knowledge_base_id
        )
        if knowledge_base is None:
            raise KnowledgeBaseNotFoundException()
        return knowledge_base

    async def update(self, *, organization_id: UUID, knowledge_base_id: UUID, current_user: User, name: str, description: str | None) -> KnowledgeBase:
        await self._require_owner(
            organization_id=organization_id,
            current_user=current_user
        )

        knowledge_base = (
            await self.knowledge_base_repository.get_by_id_for_organization(
            organization_id = organization_id,
            knowledge_base_id=knowledge_base_id,
            )
        )
        if knowledge_base is None:
            raise KnowledgeBaseNotFoundException()

        existing = await self.knowledge_base_repository.get_by_name_for_organization(
            organization_id=organization_id,
            knowledge_base_name=name,
        )

        if existing is not None and existing.id != knowledge_base.id:
            raise KnowledgeBaseAlreadyExistsException()

        knowledge_base.name = name
        knowledge_base.description = description

        await self.session.commit()

        return knowledge_base


        

    async def delete(
            self,
            *,
            organization_id: UUID,
            knowledge_base_id: UUID,
            current_user: User,
        ) -> None:

            await self._require_owner(
                organization_id=organization_id,
                current_user=current_user,
            )

            knowledge_base = (
                await self.knowledge_base_repository.get_by_id_for_organization(
                    organization_id=organization_id,
                    knowledge_base_id=knowledge_base_id,
                )
            )

            if knowledge_base is None:
                raise KnowledgeBaseNotFoundException()

            await self.knowledge_base_repository.delete(knowledge_base)

            await self.session.commit()        


