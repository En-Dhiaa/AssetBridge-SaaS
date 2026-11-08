from typing import Dict, List, Optional
from app.adapters.base import BaseAdapter
from app.adapters.magnific import MagnificAdapter
from app.adapters.motionarray import MotionArrayAdapter
from app.adapters.envato import EnvatoAdapter
from app.adapters.freepik import FreepikAdapter
from app.adapters.storyblocks import StoryblocksAdapter
from app.adapters.artgrid import ArtgridAdapter
from app.adapters.public_fallback import PublicFallbackAdapter


class AdapterRegistry:
    """
    Central Registry managing all Partner Adapters using Strategy Pattern.
    Allows real-time toggling (kill switch) and strict domain matching.
    """

    def __init__(self):
        self._adapters: Dict[str, BaseAdapter] = {}
        self._register_default_adapters()

    def _register_default_adapters(self):
        self.register(MagnificAdapter())
        self.register(MotionArrayAdapter())
        self.register(EnvatoAdapter())
        self.register(FreepikAdapter())
        self.register(StoryblocksAdapter())
        self.register(ArtgridAdapter())
        self.register(PublicFallbackAdapter())

    def register(self, adapter: BaseAdapter) -> None:
        self._adapters[adapter.partner_id] = adapter

    def get(self, partner_id: str) -> Optional[BaseAdapter]:
        return self._adapters.get(partner_id)

    def list_all(self) -> List[BaseAdapter]:
        return list(self._adapters.values())

    def get_adapter_for_url(self, url: str) -> Optional[BaseAdapter]:
        """
        Iterates through active adapters and resolves the matching strategy.
        Enterprise partner adapters are prioritized over public fallbacks.
        """
        # First check dedicated commercial partner adapters
        for partner_id, adapter in self._adapters.items():
            if partner_id == "public_fallback":
                continue
            if adapter.is_active and adapter.can_handle(url):
                return adapter

        # If no partner adapter claimed it, try public fallback
        fallback = self._adapters.get("public_fallback")
        if fallback and fallback.is_active and fallback.can_handle(url):
            return fallback

        return None

    def set_adapter_status(self, partner_id: str, is_active: bool) -> bool:
        """
        Instant Kill-Switch to pause or enable any adapter on the fly.
        """
        if partner_id in self._adapters:
            self._adapters[partner_id].is_active = is_active
            return True
        return False


registry = AdapterRegistry()
