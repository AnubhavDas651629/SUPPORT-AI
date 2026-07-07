from .base import DocumentParser
from pathlib import Path

class MarkdownParser(DocumentParser):
    def extract_text(self, file_path: Path) -> str:
        return file_path.read_text(
            encoding="UTF-8"
        )