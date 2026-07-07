from pathlib import Path
from pypdf import PdfReader
from .base import DocumentParser

class PDFParser(DocumentParser):
    def extract_text(
        self, file_path: Path
    ) -> str:
        reader = PdfReader(file_path)
        pages = []
        for page in reader.pages:
            pages.append(
                page.extract_text() or ""
            )
        return "\n".join(pages)