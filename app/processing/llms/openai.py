from collections.abc import AsyncGenerator

from httpx import stream
from app.integrations.openai import client
from .base import LLMProvider

class OpenAIProvivder(LLMProvider):
    MODEL = "gpt-4.1-mini"
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
