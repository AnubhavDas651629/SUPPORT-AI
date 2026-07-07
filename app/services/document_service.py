from uuid import UUID

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions.document import (
    DocumentAlreadyExistsException,
    DocumentNotFoundException,
)
from app.exceptions.organization import (
    KnowledgeBaseNotFoundException,
)
from app.models.document import Document, DocumentStatus
from app.models.user import User
from app.repositories.document_repository import DocumentRepository
from app.repositories.knowledge_base_repository import (
    KnowledgeBaseRepository,
)
from app.processing.processor import DocumentProcessor
from app.services.base import BaseService
from app.services.storage import LocalStorageService


class DocumentService(BaseService):

    def __init__(self, session: AsyncSession):
        super().__init__(session)

        self.document_repository = DocumentRepository(session)
        self.knowledge_base_repository = KnowledgeBaseRepository(session)

        self.storage = LocalStorageService()

    async def upload(
        self,
        *,
        organization_id: UUID,
        knowledge_base_id: UUID,
        current_user: User,
        file: UploadFile,
    ) -> Document:

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

        existing = (
            await self.document_repository.get_by_name_for_knowledge_base(
                knowledge_base_id=knowledge_base_id,
                original_filename=file.filename,
            )
        )

        if existing is not None:
            raise DocumentAlreadyExistsException()

        content = await file.read()

        storage_key = await self.storage.save(
            filename=file.filename,
            content=content,
        )

        document = await self.document_repository.create(
            knowledge_base_id=knowledge_base_id,
            original_filename=file.filename,
            storage_key=storage_key,
            mime_type=file.content_type or "application/octet-stream",
            size=len(content),
            status=DocumentStatus.PROCESSING,
        )
        await self.session.commit()
        return document

    async def list_for_knowledge_base(
        self,
        *,
        organization_id: UUID,
        knowledge_base_id: UUID,
        current_user: User,
    ) -> list[Document]:

        await self._require_member(
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

        return await self.document_repository.list_for_knowledge_base(
            knowledge_base_id=knowledge_base_id,
        )

    async def get_by_id(
        self,
        *,
        organization_id: UUID,
        knowledge_base_id: UUID,
        document_id: UUID,
        current_user: User,
    ) -> Document:

        await self._require_member(
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

        document = (
            await self.document_repository.get_by_id_for_knowledge_base(
                knowledge_base_id=knowledge_base_id,
                document_id=document_id,
            )
        )

        if document is None:
            raise DocumentNotFoundException()

        return document

    async def delete(
        self,
        *,
        organization_id: UUID,
        knowledge_base_id: UUID,
        document_id: UUID,
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

        document = (
            await self.document_repository.get_by_id_for_knowledge_base(
                knowledge_base_id=knowledge_base_id,
                document_id=document_id,
            )
        )

        if document is None:
            raise DocumentNotFoundException()

        await self.storage.delete(
            storage_key=document.storage_key,
        )

        await self.document_repository.delete(document)

        await self.session.commit()