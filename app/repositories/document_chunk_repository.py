from sqlalchemy import select
from sqlalchemy.orm import query
from app.models import knowledge_base
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.repositories.base import BaseRepository
from uuid import UUID
from sqlalchemy.orm import selectinload


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

    # after embedding, we are comparing the best k embeddings chunks with respect to the user chunks
    async def search_similar(self, *, knowledge_base_id: UUID,embedding: list[float], limit: int =5) -> list[DocumentChunk]:

        query = (
            select(DocumentChunk)
            .options(
                selectinload(DocumentChunk.document)
            )
            .join(Document)
            .where(
                Document.knowledge_base_id == knowledge_base_id,
            )
            .order_by(
                DocumentChunk.embedding.cosine_distance(
                    embedding
                )
            )
            .limit(limit)
        )
        result = await self.session.execute(query)
        return result.scalars().all()      
          



