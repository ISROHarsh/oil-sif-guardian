"""
Main API Router binding all v1 endpoints.
"""

from fastapi import APIRouter
from backend.app.api.v1.endpoints import health, reports, reviews, actions, analytics, annotation

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
api_router.include_router(reviews.router, prefix="/reports", tags=["Reviews"])
api_router.include_router(actions.router, prefix="/reports", tags=["Corrective Actions"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(annotation.router, prefix="/annotation", tags=["Annotation & Benchmark"])

