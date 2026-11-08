import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    Integer,
    BigInteger,
    Text,
    JSON,
    ForeignKey,
    Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base


def get_utc_now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

    download_jobs = relationship("DownloadJob", back_populates="user", cascade="all, delete-orphan")


class PartnerAccount(Base):
    """
    Holds partner API credentials encrypted with AES-256-GCM.
    Enables instant kill-switch and quota tracking per partner agreement.
    """
    __tablename__ = "partner_accounts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    partner_id = Column(String(50), index=True, nullable=False)  # e.g., 'magnific', 'envato'
    name = Column(String(100), nullable=False)
    encrypted_credentials = Column(Text, nullable=False)  # AES-256-GCM token or auth bundle
    is_enabled = Column(Boolean, default=True, nullable=False)
    status = Column(String(30), default="ACTIVE")  # ACTIVE, RATE_LIMITED, PAUSED, REVOKED
    quota_limit = Column(Integer, default=1000)
    quota_used = Column(Integer, default=0)
    quota_reset_period = Column(String(20), default="MONTHLY")
    agreement_reference = Column(String(100), nullable=False)  # Partner Contract/SLA ID
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)


class DownloadJob(Base):
    __tablename__ = "download_jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    partner_id = Column(String(50), index=True, nullable=False)
    asset_id = Column(String(255), index=True, nullable=False)
    asset_url = Column(Text, nullable=False)
    asset_title = Column(String(500), nullable=True)
    status = Column(String(30), default="QUEUED", index=True)  # QUEUED, STREAMING, COMPLETED, FAILED
    file_size_bytes = Column(BigInteger, default=0)
    transferred_bytes = Column(BigInteger, default=0)
    speed_mbps = Column(String(30), default="0.0")
    object_key = Column(String(500), nullable=True)
    signed_url = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)

    user = relationship("User", back_populates="download_jobs")


class AuditLogEntry(Base):
    """
    Append-only tamper-evident audit log.
    Guaranteed cryptographic hash chain (previous_hash -> current_hash).
    """
    __tablename__ = "audit_logs"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, index=True)
    user_id = Column(String(36), index=True, nullable=False)
    user_ip = Column(String(64), nullable=False)
    user_agent = Column(Text, nullable=True)
    partner_id = Column(String(50), index=True, nullable=False)
    asset_id = Column(String(255), index=True, nullable=False)
    asset_url = Column(Text, nullable=False)
    asset_title = Column(String(500), nullable=True)
    license_type = Column(String(100), nullable=False)
    license_agreement_id = Column(String(100), nullable=False)
    bytes_transferred = Column(BigInteger, default=0)
    status = Column(String(50), default="COMPLETED")
    
    # Tamper-evident hash chain
    previous_hash = Column(String(64), nullable=False)
    current_hash = Column(String(64), nullable=False, unique=True)
    meta_payload = Column(JSON, nullable=True)

    __table_args__ = (
        Index("idx_audit_partner_asset", "partner_id", "asset_id"),
        Index("idx_audit_user_created", "user_id", "created_at"),
    )


class PartnerWebhookDelivery(Base):
    __tablename__ = "partner_webhook_deliveries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    partner_id = Column(String(50), index=True, nullable=False)
    event_type = Column(String(50), nullable=False)
    payload = Column(JSON, nullable=False)
    delivered = Column(Boolean, default=False)
    response_code = Column(Integer, nullable=True)
    attempts = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)
