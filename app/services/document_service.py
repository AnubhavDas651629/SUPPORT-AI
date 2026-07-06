from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import knowledge_base
from app.models import document
from app.repositories.document_repository import DocumentRepository
from app.repositories.knowledge_base_repository import KnowledgeBaseRepository
from app.services.base import BaseService
from app.services.storage.local import LocalStorageService
from uuid import UUID
from app.repositories.user_repository import User
from app.models.document import Document, DocumentStatus


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
            current_user=current_user
        )
        knowledge_base = (
            await self.knowledge_base_repository.get_by_id_for_organization(
                organization_id=organization_id,
                knowledge_base_id=knowledge_base_id
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
            mime_type= file.content_type or "application/octet-stream", # IF USER DOES NOT UPLOADS FILE THEN IT FALLS BACK TO application/octet-stream
            size = len(content),
            status = DocumentStatus.READY
        )
        await self.session.commit()
        return document


