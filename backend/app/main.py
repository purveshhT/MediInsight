"""
MediInsight AI — FastAPI Backend
Main application entry point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.api import health, datasets, analytics, imaging, assessment, recommendations, reports

app = FastAPI(
    title="MediInsight AI API",
    description="Multimodal Healthcare Analytics & Clinical Decision Support Platform",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(datasets.router, prefix="/api/datasets", tags=["Datasets"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(imaging.router, prefix="/api/imaging", tags=["Imaging"])
app.include_router(assessment.router, prefix="/api/assessment", tags=["Assessment"])
app.include_router(assessment.image_router, prefix="/api", tags=["Images"])
app.include_router(recommendations.router, prefix="/api/recommendations", tags=["Recommendations"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])


@app.get("/")
def root():
    return {"message": "MediInsight AI API", "version": "1.0.0", "docs": "/api/docs"}

