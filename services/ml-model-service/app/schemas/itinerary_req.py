from pydantic import BaseModel, Field


class UserContext(BaseModel):
    user_id: str = Field(..., examples=["usr_98765"])


class LastLocation(BaseModel):
    latitude: float
    longitude: float


class TripContext(BaseModel):
    region_id: str
    current_time: str
    last_location: LastLocation
    draft_route_ids: list[str] = Field(default_factory=list)


class Constraints(BaseModel):
    radius_km: float = Field(..., gt=0)
    top_k: int = Field(..., ge=1, le=100)
    category_filter: list[str] = Field(default_factory=list)


class ItineraryRecommendationRequest(BaseModel):
    """JSON body contract (platform → ML) per README §5."""

    user_context: UserContext
    trip_context: TripContext
    constraints: Constraints
