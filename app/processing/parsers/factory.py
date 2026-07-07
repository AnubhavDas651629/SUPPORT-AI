from .pdf import PDFParser
from .txt import TXTParser
from .markdown import MarkdownParser
from .base import DocumentParser

class ParserFactory:
    @staticmethod
    def get_parser(
        mime_type: str
    ) -> DocumentParser:
        if mime_type == "application/pdf":
            return PDFParser()

        if mime_type == "text/plain":
            return TXTParser()

        if mime_type == "text/markdown":
            return MarkdownParser()

        raise ValueError(
            f"Unsupported mime type: {mime_type}"
        )