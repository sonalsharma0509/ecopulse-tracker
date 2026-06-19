"""Footprint calculation and insights endpoints."""

from fastapi import APIRouter, Depends, Request, Body

from app.carbon.calculator import compute_footprint
from app.config import Settings, get_settings
from app.insights.gemini import fetch_recommendations
from app.rate_limit import limiter
from app.models import FootprintInput, FootprintResult, InsightsResponse

router = APIRouter(prefix="/api", tags=["footprint"])


@router.post("/calculate", response_model=FootprintResult)
def estimate_footprint(payload: FootprintInput) -> FootprintResult:
    """Compute the annual carbon footprint breakdown for the supplied inputs."""
    return compute_footprint(payload)


@router.post("/insights", response_model=InsightsResponse)
@limiter.limit("10/minute")
async def get_recommendations(
    request: Request,
    payload: FootprintInput = Body(...),
    settings: Settings = Depends(get_settings),
) -> InsightsResponse:
    """Return personalized reduction advice (Gemini, with rule-based fallback).

    Rate-limited to 10 requests/minute per IP to protect Vertex AI quota and
    billing. The ``request`` parameter is required by SlowAPI's key function.
    """
    result = compute_footprint(payload)
    return await fetch_recommendations(payload, result, settings)
