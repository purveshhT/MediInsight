"""
Patient Assessment and Medical Image Management API
Integrates SQLite persistence, multi-format medical scan upload, and real-time clinical matching.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import os
import uuid
import shutil
from datetime import datetime
from PIL import Image
import numpy as np

from app.utils.config import UPLOADS_DIR
from app.database.db import (
    save_assessment_record, get_assessment_by_id, list_all_assessments,
    update_assessment_record, delete_assessment_record,
    add_medical_image_record, get_medical_image_by_id, delete_medical_image_by_id,
    get_connection
)
from app.services.similarity import get_similar_clinical_cases
from app.api.recommendations import _rule_based_recommendations, RecommendationRequest

router = APIRouter()

# Supported upload extensions
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".dcm", ".nii", ".nii.gz", ".tiff", ".bmp", ".pdf"}
MAX_FILE_SIZE_BYTES = 30 * 1024 * 1024  # 30 MB


class AssessmentCreateRequest(BaseModel):
    patient_name: str = Field(..., min_length=1, description="Patient Full Name (Required)")
    age: float = Field(..., ge=0, le=120, description="Patient age in years")
    gender: str = Field(..., description="male or female")
    occupation: Optional[str] = "Unspecified"
    address: Optional[str] = "Not provided"
    smoking_history: Optional[str] = "Unknown"
    smoking_pack_years: Optional[float] = None
    weight: Optional[float] = None
    histology: str = Field(..., description="adenocarcinoma, squamous cell carcinoma, large cell, or nos")
    cancer_type: Optional[str] = "Non-Small Cell Lung Cancer"
    t_stage: Optional[str] = "1"
    n_stage: Optional[str] = "0"
    m_stage: Optional[str] = "0"
    overall_stage: str = Field(..., description="I, II, IIIa, IIIb, or IV")
    clinical_stage: Optional[str] = None
    pathological_stage: Optional[str] = None
    performance_status: Optional[str] = "ECOG 0"
    egfr_status: Optional[str] = "Unknown"
    kras_status: Optional[str] = "Unknown"
    alk_status: Optional[str] = "Unknown"
    other_biomarkers: Optional[str] = None
    blood_workup: Optional[Any] = None
    medical_history: Optional[str] = None
    comorbidities: Optional[str] = None
    chemotherapy: Optional[str] = "No"
    radiation: Optional[str] = "No"
    notes: Optional[str] = None
    assessment_status: Optional[str] = "completed"
    research_sample_id: Optional[int] = None
    research_split: Optional[str] = "test"


AssessmentRequest = AssessmentCreateRequest


class AssessmentUpdateRequest(BaseModel):
    patient_name: Optional[str] = None
    age: Optional[float] = None
    gender: Optional[str] = None
    occupation: Optional[str] = None
    address: Optional[str] = None
    smoking_history: Optional[str] = None
    smoking_pack_years: Optional[float] = None
    weight: Optional[float] = None
    histology: Optional[str] = None
    cancer_type: Optional[str] = None
    t_stage: Optional[str] = None
    n_stage: Optional[str] = None
    m_stage: Optional[str] = None
    overall_stage: Optional[str] = None
    clinical_stage: Optional[str] = None
    pathological_stage: Optional[str] = None
    performance_status: Optional[str] = None
    egfr_status: Optional[str] = None
    kras_status: Optional[str] = None
    alk_status: Optional[str] = None
    other_biomarkers: Optional[str] = None
    blood_workup: Optional[Any] = None
    medical_history: Optional[str] = None
    comorbidities: Optional[str] = None
    chemotherapy: Optional[str] = None
    radiation: Optional[str] = None
    notes: Optional[str] = None
    assessment_status: Optional[str] = None
    research_sample_id: Optional[int] = None


@router.post("")
def create_assessment(payload: AssessmentCreateRequest):
    """
    Create and persist a new patient assessment in the local SQLite database.
    Performs validation, automatic ID assignment, and immediate clinical nearest-neighbor retrieval.
    """
    try:
        data = payload.dict()
        record = save_assessment_record(data)
        assessment_id = record["id"]

        # Run clinical matching
        similar = get_similar_clinical_cases(
            age=record["age"],
            gender=record["gender"],
            histology=record["histology"],
            t_stage=record["t_stage"],
            n_stage=record["n_stage"],
            m_stage=record["m_stage"],
            n_neighbors=5
        )

        # Run recommendations
        rec_req = RecommendationRequest(
            age=record["age"],
            gender=record["gender"],
            histology=record["histology"],
            overall_stage=record["overall_stage"],
            t_stage=record["t_stage"],
            n_stage=record["n_stage"],
            m_stage=record["m_stage"],
            egfr_status=record["egfr_status"],
            kras_status=record["kras_status"],
            alk_status=record["alk_status"],
        )
        recommendations = _rule_based_recommendations(rec_req)

        return {
            "status": "success",
            "assessment_id": assessment_id,
            "assessment": record,
            "similar_cases": similar.get("similar_cases", []),
            "recommendations": recommendations,
            "message": f"Assessment {assessment_id} registered successfully in persistent storage."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create assessment: {str(e)}")


@router.get("")
def list_assessments(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0)
):
    """List all persisted assessments stored in SQLite."""
    try:
        lim = int(limit.default) if hasattr(limit, "default") else int(limit)
        off = int(offset.default) if hasattr(offset, "default") else int(offset)
        records = list_all_assessments(limit=lim, offset=off)
        return {
            "total": len(records),
            "assessments": records,
            "data_source": "Newly Created Assessments (SQLite Storage)"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{assessment_id}")
def get_assessment(assessment_id: str):
    """Retrieve complete assessment record, attached images, similar cases, and recommendations."""
    record = get_assessment_by_id(assessment_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Assessment '{assessment_id}' not found.")

    # Attached images
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM medical_images WHERE assessment_id = ?", (assessment_id,))
    images = [dict(r) for r in cursor.fetchall()]
    conn.close()

    # Calculate similar cases
    similar = get_similar_clinical_cases(
        age=record["age"],
        gender=record["gender"],
        histology=record["histology"],
        t_stage=record["t_stage"],
        n_stage=record["n_stage"],
        m_stage=record["m_stage"],
        n_neighbors=5
    )

    # Calculate recommendations
    rec_req = RecommendationRequest(
        age=record["age"],
        gender=record["gender"],
        histology=record["histology"],
        overall_stage=record["overall_stage"],
        t_stage=record["t_stage"],
        n_stage=record["n_stage"],
        m_stage=record["m_stage"],
        egfr_status=record["egfr_status"],
        kras_status=record["kras_status"],
        alk_status=record["alk_status"],
    )
    recommendations = _rule_based_recommendations(rec_req)

    return {
        "assessment": record,
        "images": images,
        "similar_cases": similar.get("similar_cases", []),
        "recommendations": recommendations,
    }


@router.put("/{assessment_id}")
def update_assessment(assessment_id: str, payload: AssessmentUpdateRequest):
    """Update fields of an existing assessment."""
    update_data = {k: v for k, v in payload.dict().items() if v is not None}
    updated = update_assessment_record(assessment_id, update_data)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Assessment '{assessment_id}' not found.")
    return {"status": "success", "assessment": updated}


@router.delete("/{assessment_id}")
def delete_assessment(assessment_id: str):
    """Delete an assessment and its uploaded image files."""
    success = delete_assessment_record(assessment_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Assessment '{assessment_id}' not found.")
    return {"status": "success", "message": f"Assessment '{assessment_id}' deleted."}


# ─── MEDICAL IMAGE UPLOAD ENDPOINTS ──────────────────────────────────────────

@router.post("/{assessment_id}/images")
async def upload_medical_image(
    assessment_id: str,
    file: UploadFile = File(...)
):
    """
    Upload and securely store a medical scan associated with a patient assessment.
    Supports PNG, JPG, JPEG, TIFF, BMP, DICOM, and NIfTI formats with metadata extraction.
    """
    record = get_assessment_by_id(assessment_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Assessment '{assessment_id}' not found.")

    # Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image format '{ext}'. Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Secure unique filename
    unique_name = f"{assessment_id}_{uuid.uuid4().hex[:8]}{ext}"
    dest_path = os.path.join(UPLOADS_DIR, unique_name)

    # Save to disk
    file_size = 0
    with open(dest_path, "wb") as buffer:
        while chunk := await file.read(1024 * 1024):  # 1MB chunks
            file_size += len(chunk)
            if file_size > MAX_FILE_SIZE_BYTES:
                buffer.close()
                if os.path.exists(dest_path):
                    os.remove(dest_path)
                raise HTTPException(status_code=400, detail="File size exceeds maximum allowed 30MB limit.")
            buffer.write(chunk)

    # Extract dimensions & image type using Pillow
    dimensions = "Unknown"
    image_type = "2D Radiograph / Scan"
    try:
        with Image.open(dest_path) as img:
            dimensions = f"{img.width}x{img.height}"
            image_type = f"2D {img.format or 'Image'} ({img.mode})"
    except Exception:
        if ext in [".dcm"]:
            image_type = "DICOM Volumetric / Single Slice"
            dimensions = "DICOM Series"
        elif ext in [".nii", ".gz"]:
            image_type = "NIfTI 3D Volume"
            dimensions = "3D Voxel Grid"

    # Persist metadata to database
    img_record = add_medical_image_record(
        assessment_id=assessment_id,
        original_filename=file.filename,
        stored_filename=unique_name,
        file_format=ext,
        file_size=file_size,
        image_dimensions=dimensions,
        image_type=image_type,
        file_path=dest_path,
        processing_status="processed"
    )

    return {
        "status": "success",
        "message": f"Medical scan '{file.filename}' uploaded and associated with assessment {assessment_id}.",
        "image": img_record
    }


@router.get("/{assessment_id}/images")
def list_assessment_images(assessment_id: str):
    """List all medical scans attached to an assessment."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM medical_images WHERE assessment_id = ? ORDER BY upload_timestamp DESC", (assessment_id,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return {"total": len(rows), "images": rows}


@router.post("/{assessment_id}/images/{image_id}/analyze")
def analyze_uploaded_image(assessment_id: str, image_id: str):
    """
    Perform on-demand radiometric analysis of an uploaded patient scan.
    Extracts statistical density metrics if the format is compatible.
    Never analyzes images from another patient or research dataset.
    """
    img = get_medical_image_by_id(image_id)
    if not img or str(img.get("assessment_id")) != str(assessment_id):
        raise HTTPException(status_code=404, detail="Image not found for this assessment.")

    file_path = img.get("file_path")
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image file missing on server disk.")

    ext = img.get("file_format", "").lower()
    if ext in ["png", "jpg", "jpeg", "bmp", "tiff"]:
        try:
            with Image.open(file_path) as im:
                gray = im.convert("L")
                arr = np.array(gray, dtype=np.float32) / 255.0
                mean_val = float(arr.mean())
                std_val = float(arr.std())
                min_val = float(arr.min())
                max_val = float(arr.max())
                dense_frac = float((arr > 0.5).mean())
                aerated_frac = float((arr < 0.15).mean())

                return {
                    "status": "success",
                    "assessment_id": assessment_id,
                    "image_id": image_id,
                    "filename": img["original_filename"],
                    "analysis_status": "Completed - 2D Radiometric Profiling",
                    "compatibility": "2D Diagnostic Radiograph/Slice",
                    "metrics": {
                        "mean_attenuation": round(mean_val, 4),
                        "std_deviation": round(std_val, 4),
                        "min_density": round(min_val, 4),
                        "max_density": round(max_val, 4),
                        "dense_tissue_pct": round(dense_frac * 100, 2),
                        "aerated_fraction_pct": round(aerated_frac * 100, 2),
                        "dimensions": f"{im.width} × {im.height} px",
                        "color_space": im.mode
                    },
                    "model_compatibility_note": "Uploaded 2D scan successfully characterized via 2D radiometric profiling. Full 3D Volumetric CNN/RF benchmark specifically requires 3D CT volume series."
                }
        except Exception as e:
            return {
                "status": "error",
                "assessment_id": assessment_id,
                "image_id": image_id,
                "analysis_status": "Failed",
                "compatibility": "Incompatible",
                "error": str(e)
            }
    else:
        return {
            "status": "stored_only",
            "assessment_id": assessment_id,
            "image_id": image_id,
            "filename": img["original_filename"],
            "analysis_status": "Document Stored",
            "compatibility": "Non-Raster / Document Format",
            "metrics": None,
            "model_compatibility_note": f"Format '{ext.upper()}' securely archived in patient record. Automated visual density extraction is not applicable to non-raster documents."
        }


# Standalone image access routes mounted on /api
image_router = APIRouter()


@image_router.get("/images/{image_id}")
def get_image_info(image_id: str):
    """Retrieve metadata for a specific uploaded image."""
    img = get_medical_image_by_id(image_id)
    if not img:
        raise HTTPException(status_code=404, detail="Image not found.")
    return img


@image_router.get("/images/{image_id}/file")
def get_image_file(image_id: str):
    """Stream uploaded image file for inline preview."""
    img = get_medical_image_by_id(image_id)
    if not img or not img["file_path"] or not os.path.exists(img["file_path"]):
        raise HTTPException(status_code=404, detail="Image file not found on server disk.")

    media_type = "image/png"
    fmt = img["file_format"].lower()
    if fmt in ["jpg", "jpeg"]:
        media_type = "image/jpeg"
    elif fmt == "bmp":
        media_type = "image/bmp"
    elif fmt == "tiff":
        media_type = "image/tiff"
    elif fmt in ["dcm", "nii"]:
        media_type = "application/octet-stream"

    return FileResponse(img["file_path"], media_type=media_type, filename=img["original_filename"])


@image_router.delete("/images/{image_id}")
def delete_image(image_id: str):
    """Delete uploaded image record and file."""
    success = delete_medical_image_by_id(image_id)
    if not success:
        raise HTTPException(status_code=404, detail="Image not found.")
    return {"status": "success", "message": f"Image '{image_id}' deleted."}
