# # # #This file has one responsibility:
# # # Create a fresh database session and run the processor.

# # initially ->

# # Client
# #    │
# #    ▼
# # POST /documents
# #    │
# #    ▼
# # Upload
# #    │
# #    ▼
# # Process
# #    │
# #    ▼
# # Return


# # We are implementing(backgroundtask) ->
# # Client
# #    │
# #    ▼
# # POST /documents
# #    │
# #    ▼
# # Upload
# #    │
# #    ▼
# # Return ✅
# #    │
# #    ▼
# # Background Task
# #    │
# #    ▼
# # Process


# here's what process_document(document_id) should do ->

# Open AsyncSession
# ↓
# Load Document by ID
# ↓
# If document doesn't exist
#     return
# ↓
# Create DocumentProcessor
# ↓
# processor.process(document)
# ↓
# Done


from multiprocessing import process
from uuid import UUID

from app.db.session import AsyncSessionLocal
from app.models import document
from app.models.document import Document
from app.processing.processor import DocumentProcessor
from app.repositories import document_repository
from app.repositories.document_repository import DocumentRepository

async def run_document_processing(
    document_id:UUID,
) -> None:
    async with AsyncSessionLocal() as session:

        document_repository = DocumentRepository(session)

        document = await document_repository.get_by_id(
            document_id=document_id
        )
        if document is None:
            return

        processor = DocumentProcessor(session)

        await processor.process(
            document=document
        )