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