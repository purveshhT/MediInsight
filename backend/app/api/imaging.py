from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.analytics.analytics_engine import get_imaging_samples_list, get_sample_image, get_imaging_overview
from app.services.similarity import get_similar_imaging_cases

router = APIRouter()


@router.get("/overview")
def imaging_overview():
    """NoduleMNIST3D dataset overview."""
    try:
        return get_imaging_overview()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/samples")
def list_samples(
    split: str = Query("test", pattern="^(train|val|test)$"),
    limit: int = Query(50, ge=1, le=200)
):
    """List imaging samples for browsing."""
    try:
        return get_imaging_samples_list(split=split, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/samples/{sample_id}")
def get_sample(
    sample_id: int,
    split: str = Query("test", pattern="^(train|val|test)$")
):
    """Get a specific imaging sample with slice data."""
    try:
        result = get_sample_image(sample_id=sample_id, split=split)
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict")
def predict_nodule(sample_id: int, split: str = "test"):
    """Run nodule classification on a sample using the trained model."""
    from app.models.nodule_classifier import classify_nodule
    try:
        result = classify_nodule(sample_id=sample_id, split=split)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/similar")
def similar_imaging_cases(
    sample_id: int = Query(...),
    split: str = Query("test"),
    n_neighbors: int = Query(5, ge=1, le=20)
):
    """Find similar imaging cases using feature-based similarity."""
    try:
        return get_similar_imaging_cases(sample_id=sample_id, split=split, n_neighbors=n_neighbors)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

