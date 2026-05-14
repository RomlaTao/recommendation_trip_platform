from fastapi import APIRouter, Depends

from app.api.dependencies import get_recommendation_service
from app.schemas.itinerary_req import ItineraryRecommendationRequest
from app.schemas.itinerary_res import ItineraryRecommendationResponse
from app.services.recommendation_service import ItineraryRecommendationService

router = APIRouter(prefix="/itinerary", tags=["itinerary"])


@router.post(
    "/recommendations",
    response_model=ItineraryRecommendationResponse,
    summary="Rank place candidates (projection + mock ranker)",
)
def post_itinerary_recommendations(
    body: ItineraryRecommendationRequest,
    svc: ItineraryRecommendationService = Depends(get_recommendation_service),
) -> ItineraryRecommendationResponse:
    return svc.recommend(body)
