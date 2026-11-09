import boto3
from botocore.client import Config
from typing import Optional
from app.config import settings


class StorageService:
    def __init__(self):
        self._s3_client = None
        self.bucket = settings.S3_BUCKET_NAME
        self._bucket_checked = False

    @property
    def s3_client(self):
        if self._s3_client is None:
            self._s3_client = boto3.client(
                "s3",
                endpoint_url=settings.S3_ENDPOINT_URL,
                aws_access_key_id=settings.S3_ACCESS_KEY,
                aws_secret_access_key=settings.S3_SECRET_KEY,
                region_name=settings.S3_REGION,
                config=Config(
                    signature_version="s3v4",
                    s3={"addressing_style": "path"},
                    connect_timeout=2,
                    read_timeout=3
                )
            )
        return self._s3_client

    def _ensure_bucket_exists(self):
        if self._bucket_checked:
            return
        self._bucket_checked = True
        try:
            self.s3_client.head_bucket(Bucket=self.bucket)
        except Exception:
            try:
                self.s3_client.create_bucket(Bucket=self.bucket)
            except Exception:
                pass  # Storage fallback / offline mode

    def generate_signed_download_url(self, object_key: str, filename: str, expires_in: int = 3600) -> str:
        """
        Generates a secure pre-signed download URL for the client.
        Enforces Content-Disposition attachment with the clean asset filename.
        """
        self._ensure_bucket_exists()
        try:
            url = self.s3_client.generate_presigned_url(
                ClientMethod="get_object",
                Params={
                    "Bucket": self.bucket,
                    "Key": object_key,
                    "ResponseContentDisposition": f'attachment; filename="{filename}"'
                },
                ExpiresIn=expires_in
            )
            if settings.S3_PUBLIC_URL and settings.S3_PUBLIC_URL != settings.S3_ENDPOINT_URL:
                url = url.replace(settings.S3_ENDPOINT_URL, settings.S3_PUBLIC_URL)
            return url
        except Exception as e:
            return f"/api/v1/download/direct/{object_key}"

    def upload_file_bytes(self, object_key: str, data: bytes, content_type: str = "application/octet-stream") -> str:
        self._ensure_bucket_exists()
        self.s3_client.put_object(
            Bucket=self.bucket,
            Key=object_key,
            Body=data,
            ContentType=content_type
        )
        return object_key


storage_service = StorageService()
