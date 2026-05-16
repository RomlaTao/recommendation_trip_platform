from functools import lru_cache

from app.services.recommendation_service import ItineraryRecommendationService


@lru_cache
def get_recommendation_service() -> ItineraryRecommendationService:
    return ItineraryRecommendationService()
