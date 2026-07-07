from .base import EmbeddingProvider
from .openai import OpenAIEmbeddingProvider


class EmbeddingFactory:

    @staticmethod
    def get_provider() -> EmbeddingProvider:
        return OpenAIEmbeddingProvider()