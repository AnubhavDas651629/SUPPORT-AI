from uuid import UUID

from sqlalchemy import select

from app.models.document import Document
from app.repositories.base import BaseRepository


class DocumentRepository(BaseRepository):

    async def create(
        self,
        *,
        knowledge_base_id: UUID,
        original_filename: str,
        storage_key: str,
        mime_type: str,
        size: int,
        status,
    ) -> Document:

        document = Document(
            knowledge_base_id=knowledge_base_id,
            original_filename=original_filename,
            storage_key=storage_key,
            mime_type=mime_type,
            size=size,
            status=status,
        )

        self.session.add(document)

        await self.session.flush()

        return document

    async def list_for_knowledge_base(
        self,
        *,
        knowledge_base_id: UUID,
    ) -> list[Document]:

        query = (
            select(Document)
            .where(
                Document.knowledge_base_id == knowledge_base_id
            )
        )

        result = await self.session.execute(query)

        return list(result.scalars().all())

    async def get_by_id_for_knowledge_base(
        self,
        *,
        knowledge_base_id: UUID,
        document_id: UUID,
    ) -> Document | None:

        query = (
            select(Document)
            .where(
                Document.id == document_id,
                Document.knowledge_base_id == knowledge_base_id,
            )
        )

        result = await self.session.execute(query)

        return result.scalar_one_or_none()

    async def get_by_name_for_knowledge_base(
        self,
        *,
        knowledge_base_id: UUID,
        original_filename: str,
    ) -> Document | None:

        query = (
            select(Document)
            .where(
                Document.knowledge_base_id == knowledge_base_id,
                Document.original_filename == original_filename,
            )
        )

        result = await self.session.execute(query)

        return result.scalar_one_or_none()

    async def delete(
        self,
        document: Document,
    ) -> None:

        await self.session.delete(document)


    async def get_by_id(self, *, document_id:UUID,) -> Document | None:
        query = (
        select(Document)
        .where(
            Document.id == document_id
        )
        )

        result = await self.session.execute(query)

        return result.scalar_one_or_none()