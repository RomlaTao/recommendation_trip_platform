from pydantic import BaseModel, Field


class RecommendationItem(BaseModel):
    location_id: str
    score: float = Field(..., ge=0.0, le=1.0)
    distance_km: float = Field(..., ge=0.0)


class RecommendationMetadata(BaseModel):
    model_version: str
    inference_time_ms: int
    candidates_scored: int


class ItineraryRecommendationResponse(BaseModel):
    """JSON response contract (ML → platform) per README §5."""

    recommendations: list[RecommendationItem]
    metadata: RecommendationMetadata
