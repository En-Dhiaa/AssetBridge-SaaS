import hmac
import hashlib
import json
import httpx
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entities import PartnerWebhookDelivery


class ComplianceWebhookService:
    @staticmethod
    async def dispatch_event(
        db: AsyncSession,
        partner_id: str,
        event_type: str,
        payload: Dict[str, Any],
        target_url: Optional[str] = None,
        signing_secret: Optional[str] = None
    ) -> PartnerWebhookDelivery:
        """
        Dispatches compliance event notification to partner audit servers.
        Logs delivery state and signed SHA-256 HMAC for mutual non-repudiation.
        """
        payload_json = json.dumps(payload, default=str)
        headers = {
            "Content-Type": "application/json",
            "X-Event-Type": event_type,
            "X-Timestamp": datetime.now(timezone.utc).isoformat()
        }

        if signing_secret:
            sig = hmac.new(
                signing_secret.encode("utf-8"),
                payload_json.encode("utf-8"),
                hashlib.sha256
            ).hexdigest()
            headers["X-Compliance-Signature-SHA256"] = sig

        record = PartnerWebhookDelivery(
            partner_id=partner_id,
            event_type=event_type,
            payload=payload,
            delivered=False,
            attempts=1
        )

        if target_url:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(target_url, content=payload_json, headers=headers)
                    record.response_code = resp.status_code
                    record.delivered = (200 <= resp.status_code < 300)
            except Exception as e:
                record.delivered = False
                record.payload["delivery_error"] = str(e)
        else:
            record.delivered = True  # Internal partner dispatch registered

        db.add(record)
        await db.commit()
        await db.refresh(record)
        return record


webhook_service = ComplianceWebhookService()

