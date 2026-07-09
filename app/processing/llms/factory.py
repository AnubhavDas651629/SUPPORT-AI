from .base import LLMProvider
from .openai import OpenAIProvivder

class LLMFactory:
    @staticmethod
    def get_provider() -> LLMProvider:
        return OpenAIProvivder