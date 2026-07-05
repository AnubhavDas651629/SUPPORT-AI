

import select
from uuid import UUID

from sqlalchemy import Uuid, delete
from sqlalchemy.orm import query
from app.models import knowledge_base
from app.models.organization import Organization
from app.repositories.base import BaseRepository
from app.models.knowledge_base import KnowledgeBase


class KnowledgeBaseRepository(BaseRepository):
    async def create(self, *, organization_id: UUID, name: str, description: str | None) -> KnowledgeBase:
        knowledge_base = KnowledgeBase(
            organization_id=organization_id,
            name=name,
            description=description
        )
        self.session.add(knowledge_base)
        await self.session.flush()
        return knowledge_base

    async def list_for_organization(self, *, organization_id: UUID) -> list[KnowledgeBase]:
        query = (
            select(KnowledgeBase)
            .where(
                KnowledgeBase.organization_id == organization_id
            )
        )
        result = await self.session.execute(query)

        return list(result.scalars().all())

    async def get_by_id_for_organization(self, *, organization_id:UUID, knowledge_base_id: UUID) -> KnowledgeBase | None:
        query = (
            select(KnowledgeBase)
            .where(
                KnowledgeBase.id == knowledge_base_id,
                KnowledgeBase.organization_id == organization_id
            )
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_name_for_organization(self, *, organization_id: UUID, knowledge_base_name:str) -> KnowledgeBase | None:
        query = (
            select(KnowledgeBase)
            .where(
                KnowledgeBase.organization_id == organization_id,
                KnowledgeBase.name == knowledge_base_name
            )
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def delete(self, knowledge_base: KnowledgeBase) -> None:
            await self.session.delete(knowledge_base)
