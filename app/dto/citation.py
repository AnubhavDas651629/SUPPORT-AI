from dataclasses import dataclass
from uuid import UUID

from app.models import document

@dataclass
class Citation:
    document_id:UUID
    filename: str
    chunk_index: int 