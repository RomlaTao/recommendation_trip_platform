from __future__ import annotations

import math


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance between two WGS84 points in kilometres."""
    r_km = 6371.0088
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    h = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * r_km * math.asin(min(1.0, math.sqrt(h)))


def tag_similarity(place_tags: list[str], filter_tags: list[str]) -> float:
    """
    Jaccard similarity on lowercased tags.
    If filter is empty, returns neutral 0.5 (no preference signal).
    """
    if not filter_tags:
        return 0.5
    a = {t.strip().lower() for t in place_tags if t.strip()}
    b = {t.strip().lower() for t in filter_tags if t.strip()}
    if not a or not b:
        return 0.0
    inter = len(a & b)
    union = len(a | b)
    return inter / union if union else 0.0
