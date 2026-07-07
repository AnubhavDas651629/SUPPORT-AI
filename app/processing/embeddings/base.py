from abc import ABC, abstractmethod

class EmbeddingGenerator(ABC):
    @abstractmethod
    # the input is the array of chunks, not a single chunk, and the return would be one array for one chunk, and there are n chunks so n lists -> list[list[float]] 
    async def embed_many(self, text: list[str]) -> list [list[float]]:
