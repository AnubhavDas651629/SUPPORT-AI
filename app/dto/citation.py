from uuid import UUID
from pydantic import BaseModel

class Citation(BaseModel):
    document_id: UUID
    filename: str
    chunk_index: int 