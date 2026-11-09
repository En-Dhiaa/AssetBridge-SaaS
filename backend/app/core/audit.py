import hashlib
import json
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.models.entities import AuditLogEntry


class AuditLogger:
    """
    Append-Only Cryptographically Linked Audit Logger.
    Guarantees tamper-evidence for partner compliance audits.
    Every record points to the previous record's SHA-256 hash.
    """

    @staticmethod
    def compute_entry_hash(
        prev_hash: str,
        timestamp_iso: str,
        user_id: str,
        partner_id: str,
        asset_id: str,
        license_id: str,
        extra_data: Dict[str, Any]
    ) -> str:
        serialized = json.dumps(
            {
                "prev_hash": prev_hash,
                "timestamp": timestamp_iso,
                "user_id": user_id,
                "partner_id": partner_id,
                "asset_id": asset_id,
                "license_id": license_id,
                "extra": extra_data
            },
            sort_keys=True
        )
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

    @classmethod
    async def log_download_event(
        cls,
        db: AsyncSession,
        user_id: str,
        user_ip: str,
        user_agent: str,
        partner_id: str,
        asset_id: str,
        asset_url: str,
        asset_title: str,
        license_type: str,
        license_agreement_id: str,
        bytes_transferred: int,
        status: str = "COMPLETED",
        metadata: Optional[Dict[str, Any]] = None
    ) -> AuditLogEntry:
        """
        Appends an immutable audit log record to the database.
        Calculates the cryptographic chain link against the most recent record.
        """
        # Fetch latest entry to get previous hash
        stmt = select(AuditLogEntry).order_by(desc(AuditLogEntry.id)).limit(1)
        res = await db.execute(stmt)
        latest_entry = res.scalar_one_or_none()

        prev_hash = latest_entry.current_hash if latest_entry else "0" * 64
        now_dt = datetime.now(timezone.utc)
        now_iso = now_dt.isoformat()

        extra_data = {
            "asset_url": asset_url,
            "asset_title": asset_title,
            "user_ip": user_ip,
            "bytes_transferred": bytes_transferred,
            "status": status,
            **(metadata or {})
        }

        current_hash = cls.compute_entry_hash(
            prev_hash=prev_hash,
            timestamp_iso=now_iso,
            user_id=user_id,
            partner_id=partner_id,
            asset_id=asset_id,
            license_id=license_agreement_id,
            extra_data=extra_data
        )

        entry = AuditLogEntry(
            created_at=now_dt,
            user_id=user_id,
            user_ip=user_ip,
            user_agent=user_agent,
            partner_id=partner_id,
            asset_id=asset_id,
            asset_url=asset_url,
            asset_title=asset_title,
            license_type=license_type,
            license_agreement_id=license_agreement_id,
            bytes_transferred=bytes_transferred,
            status=status,
            previous_hash=prev_hash,
            current_hash=current_hash,
            meta_payload=extra_data
        )

        db.add(entry)
        await db.commit()
        await db.refresh(entry)
        return entry

    @classmethod
    async def verify_chain_integrity(cls, db: AsyncSession, limit: int = 100) -> bool:
        """
        Auditors can call this method to verify that no log entry has been tampered with or removed.
        """
        stmt = select(AuditLogEntry).order_by(AuditLogEntry.id.asc()).limit(limit)
        res = await db.execute(stmt)
        entries = res.scalars().all()

        if not entries:
            return True

        expected_prev_hash = "0" * 64
        for entry in entries:
            if entry.previous_hash != expected_prev_hash:
                return False  # Chain broken!

            recalculated = cls.compute_entry_hash(
                prev_hash=entry.previous_hash,
                timestamp_iso=entry.created_at.isoformat(),
                user_id=entry.user_id,
                partner_id=entry.partner_id,
                asset_id=entry.asset_id,
                license_id=entry.license_agreement_id,
                extra_data=entry.meta_payload or {}
            )

            if recalculated != entry.current_hash:
                return False  # Entry modified!

            expected_prev_hash = entry.current_hash

        return True

