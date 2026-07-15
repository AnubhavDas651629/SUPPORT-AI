from abc import ABC, abstractmethod
from ast import Dict
from collections.abc import AsyncGenerator
from typing import TypeVar
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)

class LLMProvider(ABC):
    @abstractmethod
    async def complete(self, *, messages: list[dict], temperature: float = 0) -> str:
        raise NotImplementedError

    @abstractmethod
    async def stream(self, *, messages: list[dict], temperature: float = 0) -> AsyncGenerator[str, None]:
        raise NotImplementedError

    @abstractmethod 
    #this will make sure that every provider(OpenAI, Anthropic) must support structured output
    async def complete_structured(self, *, messages: list[Dict], response_model: type[T]) -> T:
        raise NotImplementedError
    