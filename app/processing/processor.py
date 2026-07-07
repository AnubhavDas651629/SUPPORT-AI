#this will do the main architecture of the processing
# given document -> find the file -> extract text -> chunk text -> store chunks -> update document status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document, DocumentStatus
from app.models.document_chunk import DocumentChunk
from app.repositories.document_chunk_repository import DocumentChunkRepository
from .chunker import TextChunker
from pathlib import Path
from .parsers.factory import ParserFactory

class DocumentProcessor:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.chunker = TextChunker()
        self.chunk_repository = DocumentChunkRepository(session)
# Receive Document
#         │
#         ▼
# Locate file on disk
#         │
#         ▼
# Choose parser
#         │
#         ▼
# Extract text
#         │
#         ▼
# Chunk text
#         │
#         ▼
# Create DocumentChunk objects
#         │
#         ▼
# Bulk insert chunks
#         │
#         ▼
# Update document status
#         │
#         ▼
# Commit

# one embedding per chunk
# Chunk 1
#       │
#       ▼
# Embedding

# Chunk 2
#       │
#       ▼
# Embedding

# Chunk 3
#       │
#       ▼
# Embedding

    async def process(self, *, document: Document) -> None:
        try:
            # Locate file on disk -> stored files are on Storage folder so file path basically storage/documents/a8f31c2.pdf with a8f31c2 beinf the storage key of the file 
            file_path = Path("Storage") / document.storage_key

            # Choose parser
            parser = ParserFactory.get_parser(
                document.mime_type
            )

            #extract text
            text = parser.extract_text(file_path)
            #now we have str

            #chunk text
            chunks = self.chunker.split(text)
            #now we have list[str] but repository wants the format list[DocumentChunk]

            document_chunks = [
                DocumentChunk(
                    document_id=document.id,
                    chunk_index=index,
                    content = chunk,
                    token_count=len(chunk.split())
                )
                for index, chunk in enumerate(chunks)
            ]

            #bulk insert
            await self.chunk_repository.create_many(
                chunks=document_chunks
            )

            document.status = DocumentStatus.READY
            await self.session.commit()
        
        except Exception:
            await self.session.rollback() #to ensure if it fails in between for a specifc chunk then it stops and then rollsback to start and then shows FAILED, none of the previous successfully chunked texts are stored
            document.status = DocumentStatus.FAILED
            await self.session.commit()
            raise

