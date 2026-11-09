import os
import base64
import socket
import ipaddress
from datetime import datetime, timedelta, timezone
from typing import Optional, Union, Any, Dict
from urllib.parse import urlparse

import jwt
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from passlib.context import CryptContext
from fastapi import HTTPException, status, Request
import redis.asyncio as aioredis

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class SSRFViolationException(HTTPException):
    def __init__(self, detail: str = "SSRF validation failed: Untrusted or private IP target"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class RateLimitExceededException(HTTPException):
    def __init__(self, detail: str = "Rate limit exceeded. Please back off."):
        super().__init__(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=detail)


# ==============================================================================
# 1. AES-256-GCM Encryption / Decryption at Rest
# ==============================================================================
def get_cipher() -> AESGCM:
    master_key = bytes.fromhex(settings.ENCRYPTION_MASTER_KEY_HEX)
    if len(master_key) != 32:
        raise ValueError("Encryption key must be exactly 32 bytes (64 hex characters)")
    return AESGCM(master_key)


def encrypt_secret(plain_text: str) -> str:
    """
    Encrypts a plaintext string (API keys, OAuth tokens, cookies)
    using authenticated AES-256-GCM with a fresh 12-byte nonce.
    Returns: URL-safe Base64 encoded nonce + ciphertext + tag.
    """
    if not plain_text:
        return ""
    cipher = get_cipher()
    nonce = os.urandom(12)
    ciphertext = cipher.encrypt(nonce, plain_text.encode("utf-8"), None)
    payload = nonce + ciphertext
    return base64.urlsafe_b64encode(payload).decode("utf-8")


def decrypt_secret(encrypted_token: str) -> str:
    """
    Decrypts an AES-256-GCM ciphertext payload.
    Verifies authentication tag to ensure zero tampering.
    """
    if not encrypted_token:
        return ""
    try:
        raw = base64.urlsafe_b64decode(encrypted_token.encode("utf-8"))
        if len(raw) < 12 + 16:
            raise ValueError("Invalid encrypted payload length")
        nonce = raw[:12]
        ciphertext = raw[12:]
        cipher = get_cipher()
        decrypted = cipher.decrypt(nonce, ciphertext, None)
        return decrypted.decode("utf-8")
    except Exception as e:
        raise ValueError(f"Failed to decrypt secret: {str(e)}")


# ==============================================================================
# 2. SSRF Protection Engine (Strict Domain Allowlist & IP Sanity)
# ==============================================================================
def validate_url_against_ssrf(url: str, extra_allowed_domains: Optional[list[str]] = None) -> str:
    """
    Strict SSRF validation:
    1. Ensures valid HTTP/HTTPS scheme.
    2. Validates hostname against canonical allowlist.
    3. Resolves DNS and forbids Private, Loopback, Link-Local, and Cloud Metadata IPs.
    """
    if not url:
        raise SSRFViolationException("Empty URL provided")

    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise SSRFViolationException("Only HTTP and HTTPS protocols are permitted")

    hostname = parsed.hostname
    if not hostname:
        raise SSRFViolationException("URL has no valid hostname")

    allowed = set(settings.ALLOWED_DOMAINS)
    if extra_allowed_domains:
        allowed.update(extra_allowed_domains)

    # Check hostname or parent domain in allowlist
    domain_match = False
    for allowed_domain in allowed:
        if hostname == allowed_domain or hostname.endswith("." + allowed_domain):
            domain_match = True
            break

    if not domain_match:
        raise SSRFViolationException(f"Domain '{hostname}' is not in the authorized partner allowlist")

    # Resolve IP addresses and inspect for forbidden subnets
    try:
        addr_info = socket.getaddrinfo(hostname, None, socket.AF_UNSPEC, socket.SOCK_STREAM)
    except socket.gaierror:
        raise SSRFViolationException(f"Could not resolve host '{hostname}'")

    for entry in addr_info:
        ip_str = entry[4][0]
        ip = ipaddress.ip_address(ip_str)

        # Disallow loopback, private RFC1918, link-local, multicast, cloud metadata (169.254.169.254)
        if (
            ip.is_loopback
            or ip.is_private
            or ip.is_link_local
            or ip.is_multicast
            or ip.is_reserved
            or ip.is_unspecified
        ):
            raise SSRFViolationException(
                f"Security violation: Resolved IP '{ip_str}' belongs to a forbidden or private address space"
            )

    return url


# ==============================================================================
# 3. Password Hashing and JWT Token Management
# ==============================================================================
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None, extra_claims: Optional[Dict] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    if extra_claims:
        to_encode.update(extra_claims)
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ==============================================================================
# 4. Sliding Window Rate Limiter (Redis with In-Memory Fallback)
# ==============================================================================
_memory_rate_limits: Dict[str, list[float]] = {}

async def check_rate_limit(redis_client: Optional[aioredis.Redis], key: str, max_requests: int, window_seconds: int = 60) -> bool:
    """
    Sliding window log rate limiter using Redis sorted set (ZSET),
    with automatic in-memory fallback for offline/local environments.
    """
    now = datetime.now(timezone.utc).timestamp()
    window_start = now - window_seconds
    rate_key = f"rate_limit:{key}"

    if redis_client:
        try:
            pipe = redis_client.pipeline()
            pipe.zremrangebyscore(rate_key, 0, window_start)
            pipe.zcard(rate_key)
            pipe.zadd(rate_key, {str(now): now})
            pipe.expire(rate_key, window_seconds + 5)
            results = await pipe.execute()

            current_requests = results[1]
            if current_requests >= max_requests:
                return False
            return True
        except Exception:
            pass  # Fallback to memory

    # In-memory sliding window
    if rate_key not in _memory_rate_limits:
        _memory_rate_limits[rate_key] = []
    
    # Filter out timestamps older than window
    timestamps = [t for t in _memory_rate_limits[rate_key] if t > window_start]
    timestamps.append(now)
    _memory_rate_limits[rate_key] = timestamps

    return len(timestamps) <= max_requests


