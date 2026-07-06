from pathlib import Path
import uuid

from .base import StorageService


class LocalStorageService(StorageService):

    STORAGE_DIR = Path("storage/documents")

    async def save(
        self,
        *,
        filename: str,
        content: bytes,
    ) -> str:

        # Create folder if needed
        self.STORAGE_DIR.mkdir(
            parents=True,
            exist_ok=True,
        )

        # Preserve extension
        extension = Path(filename).suffix

        # Generate unique filename
        unique_filename = f"{uuid.uuid4()}{extension}"

        # Full filesystem path
        file_path = self.STORAGE_DIR / unique_filename

        # Save file
        file_path.write_bytes(content)

        # Return storage key
        return f"documents/{unique_filename}"

    async def delete(
        self,
        *,
        storage_key: str,
    ) -> None:

        file_path = Path("storage") / storage_key

        if file_path.exists():
            file_path.unlink()