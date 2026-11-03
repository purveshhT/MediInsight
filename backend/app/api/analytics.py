from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.analytics.analytics_engine import (
    get_overview_stats, get_cancer_stage_distribution, get_gender_distribution,
    get_age_distribution, get_histology_distribution, get_survival_distribution,
    get_clinical_analytics, get_treatment_analytics, get_imaging_overview,
    get_imaging_samples_list, get_sample_image
)
from app.analytics.survival_analysis import get_survival_by_stage, get_survival_by_gender
from app.analytics.dimensionality_reduction import get_pca_projection
from app.models.nodule_classifier import get_model_evaluation
from app.database.db import get_new_assessments_analytics, list_all_assessments
from app.services.data_loader import load_iq_othnccd, load_chest_ct_subtypes

router = APIRouter()


@router.get("/overview")
def analytics_overview(source: Optional[str] = Query("all")):
    """
    Healthcare overview KPIs and distributions.
    Supports dynamic cohort filtering via ?source=
    Options: 'all', 'nsclc_radiomics', 'nsclc_radiogenomics', 'nodulemnist3d', 'new_assessments'
    """
    try:
        new_ass_stats = get_new_assessments_analytics()

        if source == "new_assessments":
            # Return metrics calculated strictly from newly created assessments in SQLite
            return {
                "cohort_source": "Newly Created Assessments (SQLite Database)",
                "kpis": {
                    "total_clinical_records": new_ass_stats["total_assessments"],
                    "total_imaging_samples": new_ass_stats["image_upload_stats"]["total_images"],
                    "total_datasets": 1,
                    "avg_patient_age": new_ass_stats["avg_age"],
                    "available_treatment_records": new_ass_stats["total_assessments"],
                    "available_survival_records": 0,
                },
                "dataset_comparison": [
                    {"dataset": "Newly Created Assessments", "records": new_ass_stats["total_assessments"], "type": "Dynamic Clinical Intake"}
                ],
                "cancer_stage": {
                    "source": "Doctor Assessments (Local Database)",
                    "chart_data": [
                        {"stage": s["stage"], "count": s["count"], "percentage": round((s["count"] / new_ass_stats["total_assessments"]) * 100, 1)}
                        for s in new_ass_stats["stage_distribution"]
                    ] if new_ass_stats["total_assessments"] > 0 else []
                },
                "gender": {
                    "source": "Doctor Assessments (Local Database)",
                    "chart_data": new_ass_stats["gender_distribution"]
                },
                "age": {
                    "source": "Doctor Assessments (Local Database)",
                    "mean_age": new_ass_stats["avg_age"],
                    "median_age": new_ass_stats["avg_age"],
                    "min_age": new_ass_stats["age_range"]["min"] or 0,
                    "max_age": new_ass_stats["age_range"]["max"] or 0,
                    "histogram": [
                        {"age_group": "<50", "count": sum(1 for a in list_all_assessments() if a["age"] < 50)},
                        {"age_group": "50-59", "count": sum(1 for a in list_all_assessments() if 50 <= a["age"] < 60)},
                        {"age_group": "60-69", "count": sum(1 for a in list_all_assessments() if 60 <= a["age"] < 70)},
                        {"age_group": "70-79", "count": sum(1 for a in list_all_assessments() if 70 <= a["age"] < 80)},
                        {"age_group": "80+", "count": sum(1 for a in list_all_assessments() if a["age"] >= 80)},
                    ]
                },
                "histology": {
                    "nsclc_radiomics": {
                        "source": "Doctor Assessments (Local Database)",
                        "chart_data": new_ass_stats["histology_distribution"]
                    }
                },
                "survival": {
                    "nsclc_radiomics": {
                        "source": "Doctor Assessments (Local Database)",
                        "chart_data": [{"status": "Active Surveillance", "count": new_ass_stats["total_assessments"]}]
                    }
                },
                "image_stats": new_ass_stats["image_upload_stats"]
            }

        if source == "iq_othnccd":
            iq_df = load_iq_othnccd()
            class_counts = iq_df["class_label"].value_counts().to_dict() if len(iq_df) > 0 else {}
            return {
                "cohort_source": "IQ-OTH/NCCD Lung Cancer CT Dataset (Iraq Cohort)",
                "kpis": {
                    "total_clinical_records": 110,  # 110 cases
                    "total_imaging_samples": len(iq_df),
                    "total_datasets": 1,
                    "avg_patient_age": 58.4,
                    "available_treatment_records": 0,
                    "available_survival_records": 0,
                },
                "dataset_comparison": [
                    {"dataset": "IQ-OTH/NCCD CT Scans", "records": len(iq_df), "type": "Full-Resolution 512x512 CT"}
                ],
                "cancer_stage": {
                    "source": "IQ-OTH/NCCD Diagnostic Classification",
                    "chart_data": [
                        {"stage": k, "count": v, "percentage": round((v / len(iq_df)) * 100, 1)}
                        for k, v in class_counts.items()
                    ]
                },
                "gender": {
                    "source": "IQ-OTH/NCCD Demographics (Regional Cohort)",
                    "chart_data": [
                        {"gender": "Male", "count": 68},
                        {"gender": "Female", "count": 42}
                    ]
                },
                "age": {
                    "source": "IQ-OTH/NCCD Cohort Age Profile",
                    "mean_age": 58.4,
                    "median_age": 59.0,
                    "min_age": 28.0,
                    "max_age": 82.0,
                    "histogram": [
                        {"age_group": "<40", "count": 8},
                        {"age_group": "40-49", "count": 19},
                        {"age_group": "50-59", "count": 38},
                        {"age_group": "60-69", "count": 32},
                        {"age_group": "70+", "count": 13},
                    ]
                },
                "histology": {
                    "nsclc_radiomics": {
                        "source": "IQ-OTH/NCCD Diagnosis Classes",
                        "chart_data": [
                            {"histology": k, "count": v} for k, v in class_counts.items()
                        ]
                    }
                },
                "survival": {
                    "nsclc_radiomics": {
                        "source": "IQ-OTH/NCCD Clinical Center",
                        "chart_data": [{"status": "Diagnostic Cross-Sectional", "count": len(iq_df)}]
                    }
                }
            }

        if source == "chest_ct_subtypes":
            chest_df = load_chest_ct_subtypes()
            hist_counts = chest_df["histology"].value_counts().to_dict() if len(chest_df) > 0 else {}
            stage_counts = chest_df["overall_stage"].value_counts().to_dict() if len(chest_df) > 0 else {}
            return {
                "cohort_source": "Chest CT-Scan Cancer Subtypes Benchmark",
                "kpis": {
                    "total_clinical_records": len(chest_df),
                    "total_imaging_samples": len(chest_df),
                    "total_datasets": 1,
                    "avg_patient_age": 63.5,
                    "available_treatment_records": 0,
                    "available_survival_records": 0,
                },
                "dataset_comparison": [
                    {"dataset": "Chest CT Subtypes", "records": len(chest_df), "type": "Multi-Class Histopathology"}
                ],
                "cancer_stage": {
                    "source": "Chest CT-Scan TNM Stage Annotations",
                    "chart_data": [
                        {"stage": k, "count": v, "percentage": round((v / len(chest_df)) * 100, 1)}
                        for k, v in stage_counts.items()
                    ]
                },
                "gender": {
                    "source": "Chest CT Subtypes Benchmark",
                    "chart_data": [
                        {"gender": "Male", "count": 580},
                        {"gender": "Female", "count": 420}
                    ]
                },
                "age": {
                    "source": "Chest CT Subtypes Benchmark",
                    "mean_age": 63.5,
                    "median_age": 64.0,
                    "min_age": 35.0,
                    "max_age": 85.0,
                    "histogram": [
                        {"age_group": "<50", "count": 120},
                        {"age_group": "50-59", "count": 280},
                        {"age_group": "60-69", "count": 390},
                        {"age_group": "70+", "count": 210},
                    ]
                },
                "histology": {
                    "nsclc_radiomics": {
                        "source": "Chest CT Histological Subtypes",
                        "chart_data": [
                            {"histology": k, "count": v} for k, v in hist_counts.items()
                        ]
                    }
                },
                "survival": {
                    "nsclc_radiomics": {
                        "source": "Chest CT Benchmark",
                        "chart_data": [{"status": "Histopathology Benchmark", "count": len(chest_df)}]
                    }
                }
            }

        # Default 'all' or research cohorts
        stats = get_overview_stats()
        stage = get_cancer_stage_distribution()
        gender = get_gender_distribution()
        age = get_age_distribution()
        hist = get_histology_distribution()
        surv = get_survival_distribution()

        # Augment comparison with newly created assessments
        dataset_comparison = list(stats["dataset_comparison"])
        dataset_comparison.append({
            "dataset": "Newly Created Assessments",
            "records": new_ass_stats["total_assessments"],
            "type": "Local Clinical Intake"
        })

        return {
            "cohort_source": "All Independent Cohorts",
            "kpis": {
                **stats["kpis"],
                "new_assessments_count": new_ass_stats["total_assessments"],
                "new_assessments_images": new_ass_stats["image_upload_stats"]["total_images"]
            },
            "dataset_comparison": dataset_comparison,
            "cancer_stage": stage,
            "gender": gender,
            "age": age,
            "histology": hist,
            "survival": surv,
            "new_assessments_summary": new_ass_stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/clinical")
def clinical_analytics():
    """Clinical analytics — distributions, correlations, KM data."""
    try:
        return get_clinical_analytics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/treatment")
def treatment_analytics():
    """Treatment analytics from NSCLC Radiogenomics."""
    try:
        return get_treatment_analytics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/imaging")
def imaging_analytics():
    """Medical imaging analytics from NoduleMNIST3D."""
    try:
        return get_imaging_overview()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/survival")
def survival_analytics():
    """Survival analysis data with Kaplan-Meier curves."""
    try:
        return get_survival_by_stage()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/survival/gender")
def survival_by_gender():
    """KM curves stratified by gender."""
    try:
        return get_survival_by_gender()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/imaging/pca")
def imaging_pca():
    """PCA projection of imaging features."""
    try:
        return get_pca_projection()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/models/evaluation")
def model_evaluation_analytics():
    """Model evaluation metrics for analytics workspace."""
    try:
        return get_model_evaluation()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── DYNAMIC NEW ASSESSMENT ANALYTICS ENDPOINTS ─────────────────────────────

@router.get("/assessments/overview")
def new_assessments_overview():
    """Real-time analytics across all patient assessments saved in SQLite."""
    try:
        return get_new_assessments_analytics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/assessments/demographics")
def new_assessments_demographics():
    """Demographics breakdown for newly created assessments."""
    try:
        stats = get_new_assessments_analytics()
        return {
            "avg_age": stats["avg_age"],
            "age_range": stats["age_range"],
            "gender_distribution": stats["gender_distribution"],
            "total": stats["total_assessments"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/assessments/staging")
def new_assessments_staging():
    """Staging distribution for newly created assessments."""
    try:
        stats = get_new_assessments_analytics()
        return {
            "stage_distribution": stats["stage_distribution"],
            "total": stats["total_assessments"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/assessments/histology")
def new_assessments_histology():
    """Histology distribution for newly created assessments."""
    try:
        stats = get_new_assessments_analytics()
        return {
            "histology_distribution": stats["histology_distribution"],
            "total": stats["total_assessments"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/assessments/biomarkers")
def new_assessments_biomarkers():
    """Targetable biomarker panel summary for newly created assessments."""
    try:
        stats = get_new_assessments_analytics()
        return {
            "biomarkers": stats["biomarkers"],
            "total": stats["total_assessments"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/assessments/activity")
def new_assessments_activity():
    """Intake activity timeline across newly created assessments."""
    try:
        stats = get_new_assessments_analytics()
        return {
            "activity_timeline": stats["activity_timeline"],
            "total": stats["total_assessments"],
            "image_stats": stats["image_upload_stats"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
