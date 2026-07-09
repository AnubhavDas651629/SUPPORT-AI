from abc import ABC, abstractmethod
from collections.abc import AsyncGenerator

class LLMProvider(ABC):
    @abstractmethod
    async def complete(self, *, messages: list[dict], temperature: float = 0) -> str:
        raise NotImplementedError

    @abstractmethod
    async def stream(self, *, messages: list[dict], temperature: float = 0) -> AsyncGenerator[str, None]:
        raise NotImplementedError