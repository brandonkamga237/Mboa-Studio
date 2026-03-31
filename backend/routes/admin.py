import os
from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from services.storage import (
    get_analytics, get_config, set_maintenance,
    get_feedback, save_feedback,
)

router = APIRouter()
_bearer = HTTPBearer(auto_error=False)


def _get_pin() -> str:
    return os.getenv("ADMIN_PIN", "")


def _verify(credentials: HTTPAuthorizationCredentials | None = Depends(_bearer)) -> str:
    pin = _get_pin()
    if not pin:
        raise HTTPException(status_code=503, detail="ADMIN_PIN not configured")
    if credentials is None or credentials.credentials != pin:
        raise HTTPException(status_code=401, detail="PIN invalide")
    return credentials.credentials


# ── Auth ───────────────────────────────────────────────────────────────────

class LoginPayload(BaseModel):
    pin: str


@router.post("/admin/login")
async def admin_login(payload: LoginPayload):
    pin = _get_pin()
    if not pin:
        raise HTTPException(status_code=503, detail="ADMIN_PIN not configured")
    if payload.pin != pin:
        raise HTTPException(status_code=401, detail="PIN invalide")
    return {"ok": True, "token": pin}


# ── Stats ──────────────────────────────────────────────────────────────────

@router.get("/admin/stats")
async def admin_stats(_: str = Depends(_verify)):
    analytics = get_analytics()
    feedback = get_feedback()
    config = get_config()
    return {
        "analytics": analytics,
        "feedback_summary": {
            "total": feedback["total"],
            "average_rating": feedback["average_rating"],
        },
        "config": config,
    }


@router.get("/admin/feedback")
async def admin_feedback(_: str = Depends(_verify)):
    return get_feedback()


# ── Maintenance ────────────────────────────────────────────────────────────

class MaintenancePayload(BaseModel):
    enabled: bool
    message: str | None = None


@router.post("/admin/maintenance")
async def toggle_maintenance(payload: MaintenancePayload, _: str = Depends(_verify)):
    cfg = set_maintenance(payload.enabled, payload.message)
    return {"ok": True, "config": cfg}


# ── Feedback (public) ──────────────────────────────────────────────────────

class FeedbackPayload(BaseModel):
    rating: int
    message: str


@router.post("/feedback")
async def submit_feedback(payload: FeedbackPayload, request: Request):
    ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "unknown")
    save_feedback(payload.rating, payload.message, ip)
    return {"ok": True, "message": "Merci pour votre retour !"}
