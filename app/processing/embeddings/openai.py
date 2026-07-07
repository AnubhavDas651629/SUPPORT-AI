from app.integrations.openai import client

from .base import EmbeddingProvider


class OpenAIEmbeddingProvider(EmbeddingProvider):

    MODEL = "text-embedding-3-small"

    async def embed(
        self,
        *,
        texts: list[str],
    ) -> list[list[float]]:

        response = await client.embeddings.create(
            model=self.MODEL,
            input=texts,
        )

        return [
            item.embedding
            for item in response.data
        ]