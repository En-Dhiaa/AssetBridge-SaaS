from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_db, get_current_user
from app.models.entities import User, PartnerAccount
from app.adapters.registry import registry
from app.core.security import encrypt_secret

router = APIRouter(prefix="/adapters", tags=["Partner Adapters Management"])


class ConnectAccountRequest(BaseModel):
    partner_id: str
    account_name: str
    api_token_or_secret: str
    agreement_reference: Optional[str] = "PARTNER-CONTRACT-2026"


class AdapterDetailView(BaseModel):
    partner_id: str
    display_name: str
    is_active: bool
    is_configured: bool
    agreement_ref: str
    quota_limit: int
    quota_used: int


@router.get("/", response_model=List[AdapterDetailView])
async def list_adapters_status(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    adapters = registry.list_all()
    stmt = select(PartnerAccount)
    res = await db.execute(stmt)
    accounts = {a.partner_id: a for a in res.scalars().all()}

    output = []
    for a in adapters:
        acct = accounts.get(a.partner_id)
        output.append(AdapterDetailView(
            partner_id=a.partner_id,
            display_name=a.display_name,
            is_active=a.is_active,
            is_configured=bool(acct and acct.encrypted_credentials),
            agreement_ref=acct.agreement_reference if acct else "SLA-DEFAULT-2026",
            quota_limit=acct.quota_limit if acct else 10000,
            quota_used=acct.quota_used if acct else 0
        ))
    return output


@router.post("/connect")
async def connect_partner_account(
    req: ConnectAccountRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """
    Encrypts partner token with AES-256-GCM and stores in PostgreSQL.
    Tokens are never stored in raw plaintext at rest.
    """
    encrypted_secret = encrypt_secret(req.api_token_or_secret)

    stmt = select(PartnerAccount).where(PartnerAccount.partner_id == req.partner_id)
    res = await db.execute(stmt)
    existing = res.scalar_one_or_none()

    if existing:
        existing.name = req.account_name
        existing.encrypted_credentials = encrypted_secret
        existing.agreement_reference = req.agreement_reference or existing.agreement_reference
        existing.is_enabled = True
    else:
        new_acct = PartnerAccount(
            partner_id=req.partner_id,
            name=req.account_name,
            encrypted_credentials=encrypted_secret,
            is_enabled=True,
            agreement_reference=req.agreement_reference or "PARTNER-CONTRACT-2026",
            quota_limit=15000,
            quota_used=0
        )
        db.add(new_acct)

    await db.commit()
    return {
        "success": True,
        "partner_id": req.partner_id,
        "message": f"Partner account '{req.partner_id}' connected and credentials encrypted with AES-256-GCM."
    }

