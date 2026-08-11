from .local import LocalStorageService
from .base import StorageService
from .s3 import S3StorageService
from app.core.config import settings

def get_storage_service() -> StorageService:
    """Return s3Storage if storage_provider == 's3', else LocalStorageService"""
    if settings.storage_provider.lower() == "s3":
        return S3StorageService()
    return LocalStorageService()

__all__ = ["StorageService", "LocalStorageService", "S3StorageService", "get_storage_service"]