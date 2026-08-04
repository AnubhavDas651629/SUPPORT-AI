from abc import ABC, abstractmethod


class StorageService(ABC):

    @abstractmethod
    async def save(self,*, filename:str, content: bytes) -> str:
        """
        Save a file and return its storage key.
        Example:
            documents/abc123.pdf
        """
        raise NotImplementedError

    @abstractmethod
    async def delete(
        self,
        *,
        storage_key: str,
    ) -> None:
        """
        Delete a stored file.
        """
        raise NotImplementedError

    @abstractmethod
    async def generate_presigned_url(
        self, *, 
        storage_key: str, # it is ht unique file path/label where an document is stored in s3
        expires_in: int = 900 #15 mins
    ) -> str:
        """Generate a temporary presigned url for direct file access"""
        raise NotImplementedError
