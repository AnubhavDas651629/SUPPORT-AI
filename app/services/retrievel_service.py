from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.processing import embeddings
from app.processing.embeddings.factory import EmbeddingFactory
from app.repositories.document_chunk_repository import DocumentChunkRepository
from app.services.base import BaseService

# Question
# ↓
# Embedding Provider
# ↓
# Question Embedding
# ↓
# Repository.search_similar()
# ↓
# Return Chunks

class RetrievalService(BaseService):
    def __init__(self, *, session: AsyncSession):
        super().__init__(session)
        self.session = session
        self.chunk_repository = DocumentChunkRepository(session)
        self.embedding_provider = EmbeddingFactory.get_provider()

    async def retrieve(self, *, knowledge_base_id: UUID,question:str, limit: int = 5) -> list[DocumentChunk]:
        embeddings = await self.embedding_provider.embed(
            texts = [question]
        )
        #doing this because embed will return list[list[float]], whereas for search similiar expects: list[float], so for one question only one array so use question_embedding = embeddings[0] and pass
        question_embedding = embeddings[0]
        chunks = await self.chunk_repository.search_similar(
            knowledge_base_id = knowledge_base_id,
            embedding= question_embedding,
            limit=limit
        )
        return chunks

        hello