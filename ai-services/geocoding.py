"""Simple OpenStreetMap-based geocoding helpers for EcoSynk."""

from __future__ import annotations

from functools import lru_cache
from typing import Any, Dict, Optional

import httpx

from config import settings

NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse"


def _build_headers() -> Dict[str, str]:
    """Construct headers required by the Nominatim service."""
    user_agent = settings.geocoding_user_agent or "EcoSynk/1.0 (+support@ecosynk.local)"
    return {
        "User-Agent": user_agent,
        "Accept": "application/json",
    }


def _build_params(lat: float, lon: float) -> Dict[str, Any]:
    """Build query parameters for reverse geocoding request."""
    params: Dict[str, Any] = {
        "format": "jsonv2",
        "lat": lat,
        "lon": lon,
        "zoom": 16,
        "addressdetails": 1,
    }
    language = settings.geocoding_language or "en"
    params["accept-language"] = language
    if settings.geocoding_email:
        params["email"] = settings.geocoding_email
    return params


def _derive_display_name(data: Dict[str, Any]) -> Optional[str]:
    """Derive a concise human-readable label from Nominatim response."""
    address = data.get("address", {})
    for key in ("name", "display_name"):
        value = data.get(key)
        if value:
            return value

    preferred_keys = (
        "amenity",
        "tourism",
        "building",
        "leisure",
        "shop",
        "road",
        "neighbourhood",
        "suburb",
        "city",
        "town",
        "county",
    )
    for key in preferred_keys:
        value = address.get(key)
        if value:
            return value
    return None


@lru_cache(maxsize=512)
def _reverse_geocode_cached(lat: float, lon: float) -> Optional[Dict[str, Any]]:
    """Cached HTTP call to Nominatim reverse geocoder."""
    try:
        with httpx.Client(timeout=5.0, headers=_build_headers()) as client:
            response = client.get(NOMINATIM_REVERSE_URL, params=_build_params(lat, lon))
            response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        status = exc.response.status_code
        print(f"⚠️  Reverse geocoding failed with status {status}: {exc}")
        return None
    except Exception as exc:  # noqa: BLE001 - broad to avoid breaking ingestion
        print(f"⚠️  Reverse geocoding error: {exc}")
        return None

    data = response.json()
    if not data:
        return None

    address = data.get("address", {})
    label = _derive_display_name(data)

    return {
        "name": label,
        "display_name": data.get("display_name"),
        "address": address,
        "confidence": data.get("importance"),
        "source": "openstreetmap",
        "place_id": data.get("place_id"),
        "osm_type": data.get("osm_type"),
        "osm_id": data.get("osm_id"),
        "boundingbox": data.get("boundingbox"),
    }


def reverse_geocode(lat: Optional[float], lon: Optional[float]) -> Optional[Dict[str, Any]]:
    """Reverse geocode latitude/longitude into a place description."""
    if lat is None or lon is None:
        return None

    try:
        lat_f = float(lat)
        lon_f = float(lon)
    except (TypeError, ValueError):
        return None

    # Round to reduce cache fragmentation while keeping ~10 cm precision
    rounded_lat = round(lat_f, 6)
    rounded_lon = round(lon_f, 6)
    return _reverse_geocode_cached(rounded_lat, rounded_lon)
