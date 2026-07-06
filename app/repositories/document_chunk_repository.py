from sqlalchemy import select
from sqlalchemy.orm import query
from app.models.document_chunk import DocumentChunk
from app.repositories.base import BaseRepository
from uuid import UUID


class DocumentChunkRepository(BaseRepository):

    async def create_many(self, *, chunks: list[DocumentChunk]) -> None:
        self.session.add_all(chunks)
        await self.session.flush()

    async def list_for_document(self, *, document_id: UUID) -> list[DocumentChunk]:
        query = (
            select(DocumentChunk)
            .where(
                DocumentChunk.document_id == document_id
            )
            .order_by(
                DocumentChunk.chunk_index
            )
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())
        



