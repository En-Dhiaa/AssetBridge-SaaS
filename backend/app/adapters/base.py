from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class AssetMetadata(BaseModel):
    asset_id: str
    partner_id: str
    title: str
    description: Optional[str] = None
    preview_url: Optional[str] = None
    author: Optional[str] = "Partner Creator"
    file_type: str = "archive"  # video, template, image, audio, archive
    file_size_bytes: int = 0
    format: str = "zip"
    license_type: str = "Commercial Partner License"
    agreement_reference: str = "SLA-ENTERPRISE-2026"
    is_commercial_cleared: bool = True
    tags: List[str] = Field(default_factory=list)
    raw_response: Dict[str, Any] = Field(default_factory=dict)


class DownloadInfo(BaseModel):
    asset_id: str
    partner_id: str
    filename: str
    download_url: str
    headers: Dict[str, str] = Field(default_factory=dict)
    file_size_bytes: int = 0
    content_type: str = "application/octet-stream"
    expires_in_seconds: int = 3600
    license_certificate_url: Optional[str] = None


class QuotaInfo(BaseModel):
    partner_id: str
    total_quota: int
    used_quota: int
    remaining_quota: int
    reset_date: Optional[str] = None
    is_exceeded: bool = False


class BaseAdapter(ABC):
    """
    Abstract Strategy Interface for all integrated Design & Media Partner APIs.
    Guarantees strict compliance, credential encapsulation, and uniform streaming.
    """

    partner_id: str = "base"
    display_name: str = "Base Partner Adapter"
    is_active: bool = True

    @abstractmethod
    def can_handle(self, url: str) -> bool:
        """Determines if this adapter supports the provided asset URL."""
        pass

    @abstractmethod
    def extract_asset_id(self, url: str) -> str:
        """Parses the canonical asset identifier from the target URL."""
        pass

    @abstractmethod
    async def get_metadata(self, url: str, auth_token: str) -> AssetMetadata:
        """
        Retrieves asset metadata via the partner's official REST API.
        Enforces partner rate limits and schema normalization.
        """
        pass

    @abstractmethod
    async def get_download_info(self, asset_id: str, auth_token: str, user_id: str) -> DownloadInfo:
        """
        Requests an authorized, signed temporary download stream URL from the partner.
        Registers the commercial license certificate for compliance.
        """
        pass

    @abstractmethod
    async def check_quota(self, auth_token: str) -> QuotaInfo:
        """Queries the partner agreement quota and rate-limit status."""
        pass

    @abstractmethod
    async def dispatch_partner_webhook(self, event_data: Dict[str, Any], webhook_secret: Optional[str] = None) -> bool:
        """Dispatches an audit fulfillment webhook event back to the partner system if mandated by SLA."""
        pass
