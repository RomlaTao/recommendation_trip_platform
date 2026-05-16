from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.itinerary_router import router as itinerary_router
from app.core.config import settings
from app.core.lifespan import lifespan

app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(itinerary_router, prefix="/api/v1")


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name}
