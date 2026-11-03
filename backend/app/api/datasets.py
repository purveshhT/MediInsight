from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.utils.config import DATASET_REGISTRY
from app.services.data_loader import (
    get_dataset_stats, load_nsclc_radiomics, load_nsclc_radiogenomics,
    load_tcia_diagnosis, load_iq_othnccd, load_chest_ct_subtypes
)
from app.services.data_quality import get_full_quality_report, profile_dataframe

router = APIRouter()


@router.get("")
def list_datasets():
    """List all available datasets with metadata."""
    return {
        "datasets": list(DATASET_REGISTRY.values()),
        "total": len(DATASET_REGISTRY)
    }


@router.get("/stats")
def dataset_stats():
    """Get statistics for all datasets."""
    return get_dataset_stats()


@router.get("/quality")
def data_quality_report():
    """Get full data quality report for all datasets."""
    return get_full_quality_report()


@router.get("/{dataset_id}/summary")
def dataset_summary(dataset_id: str):
    """Get summary for a specific dataset."""
    if dataset_id not in DATASET_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Dataset '{dataset_id}' not found")
    return DATASET_REGISTRY[dataset_id]


@router.get("/{dataset_id}/quality")
def dataset_quality(dataset_id: str):
    """Get quality report for a specific dataset."""
    report = get_full_quality_report()
    if dataset_id not in report:
        raise HTTPException(status_code=404, detail=f"Dataset '{dataset_id}' not found")
    return report[dataset_id]


@router.get("/{dataset_id}/explore")
def explore_dataset(
    dataset_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    search_col: Optional[str] = None,
    search_val: Optional[str] = None,
):
    """Browse dataset records with pagination and filtering."""
    try:
        if dataset_id == "nsclc_radiomics":
            df = load_nsclc_radiomics()
        elif dataset_id == "nsclc_radiogenomics":
            df = load_nsclc_radiogenomics()
        elif dataset_id == "tcia_diagnosis":
            df = load_tcia_diagnosis()
        elif dataset_id == "iq_othnccd":
            df = load_iq_othnccd()
        elif dataset_id == "chest_ct_subtypes":
            df = load_chest_ct_subtypes()
        else:
            raise HTTPException(status_code=404, detail="Dataset not explorable")

        # Apply filter
        if search_col and search_val and search_col in df.columns:
            df = df[df[search_col].astype(str).str.contains(search_val, case=False, na=False)]

        total = len(df)
        start = (page - 1) * page_size
        end = start + page_size
        page_df = df.iloc[start:end]

        return {
            "dataset_id": dataset_id,
            "total_records": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size,
            "columns": list(df.columns),
            "records": page_df.where(page_df.notna(), None).to_dict("records")
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

