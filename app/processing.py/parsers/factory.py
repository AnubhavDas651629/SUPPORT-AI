from .pdf import PDFParser
from .txt import TXTParser
from .markdown import MarkdownParser

class ParseFactory:
    @staticmethod
    def get_parser(
        mime_type: str
    ):
        if mime_type == "application/pdf":
            return PDFParser()

        if mime_type == "text/plain":
            return TXTParser()

        if mime_type == "text/markdown":
            return MarkdownParser()

        raise ValueError(
            f"Unsupported mime type: {mime_type}"
        )