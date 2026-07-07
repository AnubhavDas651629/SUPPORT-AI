from abc import ABC, abstractmethod

class EmbeddingProvider(ABC):
    @abstractmethod
    # the input is the array of chunks, not a single chunk, and the return would be one array for one chunk, and there are n chunks so n lists -> list[list[float]] 
    async def embed(self, text: list[str]) -> list [list[float]]:
        """Generate embeddings for a list of texts"""
        raise NotImplementedError