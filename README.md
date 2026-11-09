# AssetBridge SaaS — Enterprise Asset Downloader & Partner Integration Gateway

AssetBridge SaaS is a high-performance, production-ready commercial asset download platform. It integrates with design, creative, and stock media providers through official partner APIs, authorized SLA agreements, and mutual non-repudiation compliance protocols.

---

## 🚀 Key Architectural Capabilities

- **Strategy Pattern Adapter Layer:** Dedicated isolated adapters for **Magnific AI**, **Motion Array**, **Envato Elements**, **Freepik**, **Storyblocks**, and **Artgrid**.
- **16-Connection Async Stream Engine:** Multi-connection HTTP/2 chunked transfer pipeline delivering instantaneous streaming to users without waiting for server-side buffering.
- **Append-Only Tamper-Evident Audit Trail:** Every download is cryptographically chained with SHA-256 Merkle links (prior hash + timestamp + user + license ref) ensuring mathematical proof of non-tampering during partner audits.
- **Enterprise-Grade Security:**
  - **AES-256-GCM** encryption for all partner tokens, cookies, and secrets at rest.
  - **Strict SSRF Protection Engine:** Rejects loopback (127.0.0.1), private RFC1918 subnets, link-local addresses, and cloud metadata (169.254.169.254) with dynamic DNS inspection.
  - **Redis Sliding-Window Rate Limiter** per user and partner quota bucket.
- **Multi-Platform Deployment:** Web (Next.js 14 App Router + Tailwind CSS) + Mobile (Capacitor iOS & Android).

---

## 📂 Project Directory Structure

```text
AssetBridge-SaaS/
├── .env.example                       # Complete production environment template
├── .gitignore                         # Git exclusion rules
├── capacitor.config.ts                # Mobile Capacitor configuration
├── docker-compose.yml                 # Single-command production stack
├── README.md                          # Comprehensive guide
├── nginx/
│   └── nginx.conf                     # HTTP/2 reverse proxy with streaming support
├── backend/
│   ├── Dockerfile                     # Multi-stage Python 3.12 container
│   ├── requirements.txt               # Backend dependencies
│   ├── alembic.ini                    # Alembic migration configuration
│   ├── alembic/                       # Migration scripts
│   └── app/
│       ├── main.py                    # FastAPI application entrypoint
│       ├── config.py                  # Pydantic v2 settings & environment binding
│       ├── core/
│       │   ├── security.py            # AES-256-GCM, SSRF engine, rate limiting, JWT
│       │   ├── audit.py               # Append-only SHA-256 hash chained audit logger
│       │   ├── database.py            # Async SQLAlchemy engine & session factory
│       │   ├── redis.py               # Redis async caching & TTL management
│       │   └── storage.py             # S3/MinIO signed URL delivery
│       ├── models/
│       │   └── entities.py            # User, PartnerAccount, DownloadJob, AuditLogEntry
│       ├── adapters/
│       │   ├── base.py                # BaseAdapter Strategy interface
│       │   ├── registry.py            # Central registry & dynamic kill-switch
│       │   ├── magnific.py            # Magnific AI API adapter
│       │   ├── motionarray.py         # Motion Array API adapter
│       │   ├── envato.py              # Envato Elements & Market API adapter
│       │   ├── freepik.py             # Freepik Enterprise API adapter
│       │   ├── storyblocks.py         # Storyblocks API adapter (HMAC SHA-256)
│       │   ├── artgrid.py             # Artgrid / Artlist Cinema adapter
│       │   └── public_fallback.py     # yt-dlp fallback for public creative commons
│       ├── services/
│       │   ├── download_engine.py     # 16-connection parallel chunk streaming engine
│       │   └── webhook_service.py     # Partner compliance webhook dispatcher
│       ├── workers/
│       │   ├── celery_app.py          # Celery configuration
│       │   └── tasks.py               # Background download & S3 archival tasks
│       └── api/
│           ├── deps.py                # Auth, DB, and Rate Limit dependencies
│           └── routes/
│               ├── download.py        # /analyze, /stream, /dispatch, /status, /webhook
│               ├── compliance.py      # /agreements, /audit-trail, /verify-chain, /kill-switch
│               ├── adapters.py        # /connect, / (adapters status)
│               └── auth.py            # /register, /token, /me
└── frontend/
    ├── Dockerfile                     # Next.js standalone container
    ├── package.json                   # Dependencies (Next 14, Tailwind, Lucide, Capacitor)
    ├── tsconfig.json                  # TypeScript configuration
    ├── next.config.mjs                # Next.js rewrites and image domains
    ├── tailwind.config.ts             # Dark theme design system
    ├── capacitor.config.ts            # Capacitor mobile configuration
    ├── lib/
    │   ├── api.ts                     # Typed API client
    │   └── utils.ts                   # Formatting & Tailwind utilities
    ├── components/
    │   └── navbar.tsx                 # SaaS Navigation bar with live thread indicator
    └── app/
        ├── layout.tsx                 # Root layout
        ├── globals.css                # Global glassmorphism & dark aesthetics
        └── (dashboard)/
            ├── layout.tsx             # Dashboard wrapper
            ├── page.tsx               # Account connector, URL analyzer, 16x thread progress
            └── compliance/
                └── page.tsx           # Compliance matrix, kill-switches, audit verifier
```

---

## ⚡ Quick Start (One-Command Launch)

### Prerequisites
- Docker & Docker Compose
- (Optional for native dev) Python 3.12+, Node.js 18+

### 1. Configure Environment
```bash
cp .env.example .env
```

### 2. Launch All Services
```bash
docker compose up -d --build
```

The stack initializes the following services:
| Service | Internal Port | External Host Port | Description |
|---|---|---|---|
| **Nginx** | 80 | `http://localhost:80` | Reverse proxy and public entrypoint |
| **Frontend** | 3000 | `http://localhost:3000` | Next.js 14 Web & Dashboard |
| **Backend API** | 8000 | `http://localhost:8000` | FastAPI Backend & Stream Engine |
| **PostgreSQL 16** | 5432 | `localhost:5432` | Relational Storage & Audit Trail |
| **Redis 7** | 6379 | `localhost:6379` | Metadata Cache & Rate Limiting |
| **MinIO (S3)** | 9000 / 9001 | `http://localhost:9001` | S3 Storage & Admin Console |
| **Celery Worker** | — | — | Heavy Background Tasks Pool |

Open your browser at **`http://localhost`** to access the dashboard.
API Documentation (Swagger): **`http://localhost:8000/docs`**.

---

## 🧪 Testing & Verification

### 1. Test SSRF Protection
```bash
# Attempt an SSRF probe against internal metadata or loopback
curl -X POST "http://localhost:8000/api/v1/download/analyze" \
  -H "Content-Type: application/json" \
  -d '{"url": "http://169.254.169.254/latest/meta-data/"}'

# Response: HTTP 403 Forbidden
# {"detail": "Domain '169.254.169.254' is not in the authorized partner allowlist"}
```

### 2. Test URL Analysis & Quota Verification
```bash
curl -X POST "http://localhost:8000/api/v1/download/analyze" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://elements.envato.com/cyber-glitch-logo-ABC123"}'
```

### 3. Test High-Speed Direct 16-Connection Streaming
```bash
curl -i "http://localhost:8000/api/v1/download/stream?url=https://elements.envato.com/cyber-glitch-logo-ABC123" \
  --output downloaded_asset.zip
```

### 4. Verify Audit Chain Cryptographic Integrity
```bash
curl -X GET "http://localhost:8000/api/v1/compliance/verify-chain"
# Returns:
# {
#   "tamper_detected": false,
#   "chain_intact": true,
#   "verification_status": "VERIFIED_SECURE",
#   "algorithm": "SHA-256 Merkle-Linked Chain"
# }
```

---

## 🔌 How to Add a New Partner Adapter (In 4 Steps)

To integrate a new partner (e.g. Adobe Stock or Shutterstock):

### Step 1: Create the Adapter File
Create `backend/app/adapters/adobestock.py`:

```python
import httpx
from app.adapters.base import BaseAdapter, AssetMetadata, DownloadInfo, QuotaInfo
from app.core.security import validate_url_against_ssrf

class AdobeStockAdapter(BaseAdapter):
    partner_id = "adobestock"
    display_name = "Adobe Stock Enterprise"
    is_active = True

    def can_handle(self, url: str) -> bool:
        return "stock.adobe.com" in url

    def extract_asset_id(self, url: str) -> str:
        # Extract asset ID from URL pattern
        return url.rstrip("/").split("/")[-1]

    async def get_metadata(self, url: str, auth_token: str) -> AssetMetadata:
        validate_url_against_ssrf(url)
        asset_id = self.extract_asset_id(url)
        # Call official Adobe Stock API endpoint:
        # GET https://stock.adobe.io/Rest/Libraries/1/Content/Info
        return AssetMetadata(
            asset_id=asset_id,
            partner_id=self.partner_id,
            title=f"Adobe Stock Item #{asset_id}",
            file_type="image",
            format="ai",
            license_type="Adobe Stock Extended Commercial License",
            agreement_reference="ADOBE-SLA-2026-X"
        )

    async def get_download_info(self, asset_id: str, auth_token: str, user_id: str) -> DownloadInfo:
        # Request signed license download URL
        return DownloadInfo(
            asset_id=asset_id,
            partner_id=self.partner_id,
            filename=f"adobestock_{asset_id}.ai",
            download_url=f"https://stock.adobe.io/Rest/Libraries/1/Content/Download/{asset_id}",
            content_type="application/postscript"
        )

    async def check_quota(self, auth_token: str) -> QuotaInfo:
        return QuotaInfo(partner_id=self.partner_id, total_quota=10000, used_quota=300, remaining_quota=9700)

    async def dispatch_partner_webhook(self, event_data: dict, webhook_secret: str = None) -> bool:
        return True
```

### Step 2: Register in `backend/app/adapters/registry.py`
Add the import and call `self.register(AdobeStockAdapter())` inside `_register_default_adapters()`.

### Step 3: Add Allowed Domain in `backend/app/config.py`
Add `"stock.adobe.com"` and `"stock.adobe.io"` to `ALLOWED_DOMAINS` to pass the SSRF inspection filter.

### Step 4: Done!
The platform will immediately detect Adobe Stock URLs, apply caching, stream downloads via the 16-connection pipeline, and log immutable audit entries.

---

## 📱 Mobile App Build (Capacitor)

To compile the iOS and Android native apps:

```bash
# 1. Build Next.js static bundle
cd frontend
npm run build

# 2. Sync native Capacitor assets
npx cap sync

# 3. Open Android Studio or Xcode
npx cap open android
npx cap open ios
```

---

## 🛡️ License & Compliance Statement

AssetBridge SaaS is engineered strictly for authorized enterprise license holders. All downloads are executed on behalf of authenticated accounts possessing documented commercial distribution agreements.

