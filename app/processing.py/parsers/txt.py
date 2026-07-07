from pathlib import Path
from .base import DocumentParser

class TXTParser(DocumentParser):
    def extract_text(self, file_path: Path) -> str:
        return file_path.read_text(
            encoding="UTF-8"
        )