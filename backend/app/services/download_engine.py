import asyncio
import httpx
from typing import AsyncGenerator, Dict, Optional, Tuple
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.config import settings
from app.core.security import validate_url_against_ssrf


class ParallelDownloadEngine:
    """
    High-Performance Multi-Connection Download & Streaming Engine.
    - Up to 16 parallel async HTTP chunk connections via httpx connection pool.
    - Pipelined directly into an async streaming generator for zero-wait client delivery.
    - 3-step automatic retry with exponential backoff on transient network faults.
    """

    def __init__(
        self,
        max_connections: int = 16,
        chunk_size_bytes: int = 2 * 1024 * 1024,  # 2MB chunks for optimum streaming
        timeout_seconds: float = 60.0
    ):
        self.max_connections = min(max_connections, settings.MAX_PARALLEL_CHUNKS)
        self.chunk_size = chunk_size_bytes
        self.timeout = timeout_seconds

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=0.5, min=1, max=10),
        retry=retry_if_exception_type((httpx.RequestError, httpx.HTTPStatusError)),
        reraise=True
    )
    async def fetch_remote_headers(self, url: str, headers: Optional[Dict[str, str]] = None) -> Tuple[int, str, bool]:
        """
        Queries upstream resource via HEAD/GET to inspect Content-Length, Content-Type,
        and whether byte range requests ('Accept-Ranges: bytes') are supported.
        """
        validate_url_against_ssrf(url)
        req_headers = {"User-Agent": "AssetBridge-StreamEngine/2.0"}
        if headers:
            req_headers.update(headers)

        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            try:
                resp = await client.head(url, headers=req_headers)
                if resp.status_code in (200, 206):
                    size = int(resp.headers.get("content-length", 0))
                    c_type = resp.headers.get("content-type", "application/octet-stream")
                    accept_ranges = "bytes" in resp.headers.get("accept-ranges", "").lower()
                    return size, c_type, accept_ranges
            except Exception:
                pass

            # Fallback to GET with range: 0-0
            req_headers["Range"] = "bytes=0-0"
            resp = await client.get(url, headers=req_headers)
            size = 0
            c_type = resp.headers.get("content-type", "application/octet-stream")
            content_range = resp.headers.get("content-range", "")
            if "/" in content_range:
                try:
                    size = int(content_range.split("/")[-1])
                except ValueError:
                    size = 0
            return size, c_type, bool(size > 0)

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=0.5, min=0.5, max=5),
        retry=retry_if_exception_type((httpx.RequestError, httpx.HTTPStatusError)),
        reraise=True
    )
    async def fetch_chunk(
        self,
        client: httpx.AsyncClient,
        url: str,
        start_byte: int,
        end_byte: int,
        headers: Dict[str, str]
    ) -> bytes:
        """Fetches a specific byte range with auto-retry."""
        chunk_headers = dict(headers)
        chunk_headers["Range"] = f"bytes={start_byte}-{end_byte}"
        resp = await client.get(url, headers=chunk_headers)
        if resp.status_code not in (200, 206):
            raise httpx.HTTPStatusError("Non 20x status for chunk", request=resp.request, response=resp)
        return resp.content

    async def stream_multi_connection(
        self,
        url: str,
        headers: Optional[Dict[str, str]] = None,
        total_size: int = 0
    ) -> AsyncGenerator[bytes, None]:
        """
        Pipelines parallel connections and yields ordered byte chunks continuously.
        Client receives data instantly as early chunks arrive without buffering the full file.
        """
        validate_url_against_ssrf(url)
        base_headers = {"User-Agent": "AssetBridge-StreamEngine/2.0"}
        if headers:
            base_headers.update(headers)

        limits = httpx.Limits(max_connections=self.max_connections, max_keepalive_connections=self.max_connections)

        if total_size <= 0:
            # Fallback to single async streaming stream
            async with httpx.AsyncClient(limits=limits, timeout=self.timeout, follow_redirects=True) as client:
                async with client.stream("GET", url, headers=base_headers) as response:
                    async for chunk in response.aiter_bytes(chunk_size=128 * 1024):
                        if chunk:
                            yield chunk
            return

        # Prepare chunk ranges
        chunks: list[Tuple[int, int]] = []
        curr = 0
        while curr < total_size:
            end = min(curr + self.chunk_size - 1, total_size - 1)
            chunks.append((curr, end))
            curr = end + 1

        async with httpx.AsyncClient(limits=limits, timeout=self.timeout, follow_redirects=True) as client:
            # Pipeline batches of parallel chunks (e.g. 4 to 16 concurrently) in ordered window
            window_size = self.max_connections
            for i in range(0, len(chunks), window_size):
                batch_ranges = chunks[i:i + window_size]
                tasks = [
                    self.fetch_chunk(client, url, start, end, base_headers)
                    for start, end in batch_ranges
                ]
                batch_results = await asyncio.gather(*tasks)
                for chunk_data in batch_results:
                    yield chunk_data


download_engine = ParallelDownloadEngine()

