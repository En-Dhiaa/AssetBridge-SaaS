import asyncio
import time
import httpx
from app.workers.celery_app import celery_app
from app.config import settings
from app.core.storage import storage_service
from app.core.security import validate_url_against_ssrf


@celery_app.task(bind=True, name="process_background_download")
def process_background_download(self, job_id: str, download_url: str, filename: str, headers: dict):
    """
    Worker task to download large media files into S3/MinIO bucket
    and return pre-signed download URL.
    """
    validate_url_against_ssrf(download_url)
    self.update_state(state="PROCESSING", meta={"job_id": job_id, "progress": 10})

    buffer = bytearray()
    with httpx.Client(timeout=300.0, follow_redirects=True) as client:
        with client.stream("GET", download_url, headers=headers) as response:
            total = int(response.headers.get("content-length", 0))
            downloaded = 0
            for chunk in response.iter_bytes(chunk_size=1024 * 1024):
                if chunk:
                    buffer.extend(chunk)
                    downloaded += len(chunk)
                    if total > 0:
                        pct = int((downloaded / total) * 90)
                        self.update_state(state="DOWNLOADING", meta={"progress": pct, "downloaded": downloaded})

    # Save to S3
    object_key = f"assets/{job_id}/{filename}"
    storage_service.upload_file_bytes(object_key, bytes(buffer))
    signed_url = storage_service.generate_signed_download_url(object_key, filename, expires_in=86400)

    return {
        "job_id": job_id,
        "status": "COMPLETED",
        "progress": 100,
        "object_key": object_key,
        "signed_url": signed_url,
        "file_size": len(buffer)
    }
