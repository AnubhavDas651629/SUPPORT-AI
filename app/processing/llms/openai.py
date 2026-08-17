from collections.abc import AsyncGenerator

from typing import TypeVar
from pydantic import BaseModel 
from app.integrations.openai import client
from .base import LLMProvider
import openai
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
T = TypeVar("T", bound=BaseModel)



class OpenAIProvivder(LLMProvider):
    MODEL = "gpt-4.1-mini"
    # Wait 2s, then 4s, up to 3 attempts. Only retry for connection/server/rate-limit issues.
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((openai.RateLimitError, openai.APIConnectionError, openai.InternalServerError)),
        reraise=True
    )
    async def complete(self, *, messages: list[dict], temperature: float = 0) -> str:
        response = await client.chat.completions.create(
            model = self.MODEL,
            messages=messages,
            temperature=temperature
        )
        return response.choices[0].message.content or ""

    async def stream(self, *, messages: list[dict], temperature: float = 0) -> AsyncGenerator[str, None]:
        stream = await client.chat.completions.create(
            model = self.MODEL,
            messages=messages,
            temperature=temperature,
            stream=True
        )
        async for chunk in stream:

            delta = chunk.choices[0].delta.content
            if delta:
                yield delta


    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((openai.RateLimitError, openai.APIConnectionError, openai.InternalServerError)),
        reraise=True
    )
    async def complete_structured(self, *, messages: list[dict], response_model: type[T]) -> T:
        response = await client.beta.chat.completions.parse(
            model=self.MODEL,
            messages=messages,
            response_format=response_model,
        )
        return response.choices[0].message.parsed