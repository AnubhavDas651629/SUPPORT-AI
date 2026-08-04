from kombu.asynchronous.http import Client
from pathlib import Path
from app.core.config import settings
import boto3
import uuid
from .base import StorageService
from botocore.exceptions import ClientError

class S3StorageService(StorageService):
    def __init__(self):
        self.s3_client = boto3.client(
            "s3",
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_region
        )
        self.bucket_name=settings.s3_bucket_name

    async def save (self, *, filename:str, content: bytes) -> str:
        extension = Path(filename).suffix
        unique_filename = f"{uuid.uuid4()}{extension}"
        storage_key = f"documents/{unique_filename}"

        self.s3_client.put_object(
            Bucket=self.bucket_name,
            Key=storage_key,
            body=content
        )
        return storage_key

    async def delete(self, *, storage_key:str) -> None:
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                key=storage_key
            )
        except ClientError:
            pass

    async def generate_presigned_url(
        self, *,
        storage_key: str,
        expires_in: int = 900,
    ) -> str:
        """Generate a 15 minute temporary presigned S3 download URL"""
        url = self.s3_client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": self.bucket_name,
                "key": storage_key
            },
            ExpiresIn=expires_in
        )
        return url

    

    
