import asyncio

from app.processing.embeddings.factory import EmbeddingFactory


async def main():
    provider = EmbeddingFactory.get_provider()

    vectors = await provider.embed(
        texts=[
            "FastAPI is a modern Python web framework.",
            "OpenAI develops artificial intelligence models.",
        ]
    )

    print(f"Number of embeddings: {len(vectors)}")
    print(f"Embedding dimensions: {len(vectors[0])}")

    print("\nFirst 10 numbers of the first embedding:")
    print(vectors[0][:10])


if __name__ == "__main__":
    asyncio.run(main())