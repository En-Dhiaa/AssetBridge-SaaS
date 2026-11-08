from app.adapters.base import BaseAdapter, AssetMetadata, DownloadInfo, QuotaInfo
from app.adapters.registry import registry
from app.adapters.magnific import MagnificAdapter
from app.adapters.motionarray import MotionArrayAdapter
from app.adapters.envato import EnvatoAdapter
from app.adapters.freepik import FreepikAdapter
from app.adapters.storyblocks import StoryblocksAdapter
from app.adapters.artgrid import ArtgridAdapter
from app.adapters.public_fallback import PublicFallbackAdapter

__all__ = [
    "BaseAdapter",
    "AssetMetadata",
    "DownloadInfo",
    "QuotaInfo",
    "registry",
    "MagnificAdapter",
    "MotionArrayAdapter",
    "EnvatoAdapter",
    "FreepikAdapter",
    "StoryblocksAdapter",
    "ArtgridAdapter",
    "PublicFallbackAdapter",
]
