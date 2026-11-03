"""
Analytics engine — all chart data computations
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from app.services.data_loader import (
    load_nsclc_radiomics, load_nsclc_radiogenomics,
    load_tcia_diagnosis, load_nodule_mnist, get_dataset_stats,
    load_iq_othnccd, load_chest_ct_subtypes
)


def safe_value_counts(series: pd.Series, normalize: bool = False) -> Dict[str, Any]:
    """Convert a value_counts result to a JSON-serializable dict."""
    vc = series.dropna().value_counts(normalize=normalize)
    if normalize:
        return {str(k): round(float(v), 4) for k, v in vc.items()}
    return {str(k): int(v) for k, v in vc.items()}


# ─── HEALTHCARE OVERVIEW ─────────────────────────────────────────────────────

def get_overview_stats() -> Dict[str, Any]:
    """KPI stats for the healthcare overview dashboard."""
    stats = get_dataset_stats()
    rad = load_nsclc_radiomics()
    rg = load_nsclc_radiogenomics()
    iq = load_iq_othnccd()
    chest = load_chest_ct_subtypes()

    total_clinical = len(rad) + len(rg)
    total_imaging = 1633 + len(iq) + len(chest)
    combined_ages = pd.concat([rad["age"], rg["age"]]).dropna()
    avg_age_combined = round(float(combined_ages.mean()), 1)

    return {
        "kpis": {
            "total_clinical_records": int(total_clinical),
            "total_imaging_samples": int(total_imaging),
            "total_datasets": 6,
            "avg_patient_age": avg_age_combined,
            "nsclc_radiomics_records": int(len(rad)),
            "nsclc_radiogenomics_records": int(len(rg)),
            "available_treatment_records": int(len(rg)),
            "available_survival_records": int(len(rad)),
            "iq_othnccd_scans": int(len(iq)),
            "chest_ct_subtypes_scans": int(len(chest)),
        },
        "dataset_comparison": [
            {"dataset": "NoduleMNIST3D", "records": 1633, "type": "3D CT Volumetric Benchmark"},
            {"dataset": "IQ-OTH/NCCD Lung CT", "records": int(len(iq)), "type": "Full-Resolution 512x512 CT"},
            {"dataset": "Chest CT Subtypes", "records": int(len(chest)), "type": "Histology & Stage Cross-Sections"},
            {"dataset": "NSCLC-Radiomics", "records": int(len(rad)), "type": "Clinical & Staging Cohort"},
            {"dataset": "NSCLC Radiogenomics", "records": int(len(rg)), "type": "Genomic & Treatment Cohort"},
            {"dataset": "TCIA Diagnosis", "records": 157, "type": "LIDC-IDRI Diagnosis Metadata"},
        ]
    }


def get_cancer_stage_distribution() -> Dict[str, Any]:
    """Stage distribution from NSCLC-Radiomics."""
    rad = load_nsclc_radiomics()
    vc = safe_value_counts(rad["Overall.Stage"])
    return {
        "source": "NSCLC-Radiomics (Lung1)",
        "total_records": int(len(rad)),
        "distribution": vc,
        "chart_data": [
            {"stage": k, "count": v, "percentage": round(v / len(rad.dropna(subset=["Overall.Stage"])) * 100, 1)}
            for k, v in vc.items()
        ]
    }


def get_gender_distribution() -> Dict[str, Any]:
    """Gender distribution from NSCLC-Radiomics."""
    rad = load_nsclc_radiomics()
    vc = safe_value_counts(rad["gender"])
    return {
        "source": "NSCLC-Radiomics (Lung1)",
        "distribution": vc,
        "chart_data": [{"gender": k, "count": v} for k, v in vc.items()]
    }


def get_age_distribution() -> Dict[str, Any]:
    """Age histogram data from NSCLC-Radiomics."""
    rad = load_nsclc_radiomics()
    ages = rad["age"].dropna()

    # Bin into decades
    bins = [0, 40, 50, 60, 70, 80, 90, 120]
    labels = ["<40", "40-49", "50-59", "60-69", "70-79", "80-89", "90+"]
    age_groups = pd.cut(ages, bins=bins, labels=labels, right=False)
    group_counts = age_groups.value_counts().sort_index()

    return {
        "source": "NSCLC-Radiomics (Lung1)",
        "min_age": round(float(ages.min()), 1),
        "max_age": round(float(ages.max()), 1),
        "mean_age": round(float(ages.mean()), 1),
        "median_age": round(float(ages.median()), 1),
        "histogram": [
            {"age_group": str(k), "count": int(v)}
            for k, v in group_counts.items()
        ],
        "raw_values": [round(float(x), 1) for x in ages.tolist()]
    }


def get_histology_distribution() -> Dict[str, Any]:
    """Histology distribution from both NSCLC datasets."""
    rad = load_nsclc_radiomics()
    rg = load_nsclc_radiogenomics()

    rad_hist = safe_value_counts(rad["Histology"])
    rg_hist = safe_value_counts(rg["histology"]) if "histology" in rg.columns else {}

    return {
        "nsclc_radiomics": {
            "source": "NSCLC-Radiomics (Lung1)",
            "distribution": rad_hist,
            "chart_data": [{"histology": k, "count": v} for k, v in rad_hist.items()]
        },
        "nsclc_radiogenomics": {
            "source": "NSCLC Radiogenomics",
            "distribution": rg_hist,
            "chart_data": [{"histology": k, "count": v} for k, v in rg_hist.items()]
        }
    }


def get_survival_distribution() -> Dict[str, Any]:
    """Survival status from NSCLC-Radiomics."""
    rad = load_nsclc_radiomics()
    rg = load_nsclc_radiogenomics()

    # NSCLC Radiomics: deadstatus.event (1=dead, 0=alive/censored)
    rad_surv = safe_value_counts(rad["deadstatus.event"].map({0: "Censored/Alive", 1: "Dead"}))

    # NSCLC Radiogenomics: survival_status
    rg_surv = safe_value_counts(rg["survival_status"]) if "survival_status" in rg.columns else {}

    return {
        "nsclc_radiomics": {
            "source": "NSCLC-Radiomics (Lung1)",
            "distribution": rad_surv,
            "chart_data": [{"status": k, "count": v} for k, v in rad_surv.items()]
        },
        "nsclc_radiogenomics": {
            "source": "NSCLC Radiogenomics",
            "distribution": rg_surv,
            "chart_data": [{"status": k, "count": v} for k, v in rg_surv.items()]
        }
    }


# ─── CLINICAL ANALYTICS ───────────────────────────────────────────────────────

def get_clinical_analytics() -> Dict[str, Any]:
    """Comprehensive clinical analytics from NSCLC-Radiomics."""
    rad = load_nsclc_radiomics()

    # Age by stage box plot data
    age_by_stage = {}
    for stage in rad["Overall.Stage"].dropna().unique():
        grp = rad[rad["Overall.Stage"] == stage]["age"].dropna()
        if len(grp) > 0:
            age_by_stage[str(stage)] = {
                "min": round(float(grp.min()), 1),
                "q1": round(float(grp.quantile(0.25)), 1),
                "median": round(float(grp.median()), 1),
                "q3": round(float(grp.quantile(0.75)), 1),
                "max": round(float(grp.max()), 1),
                "mean": round(float(grp.mean()), 1),
                "count": int(len(grp))
            }

    # Gender vs histology
    gender_hist = {}
    if "gender" in rad.columns and "Histology" in rad.columns:
        cross = rad.groupby(["gender", "Histology"]).size().reset_index(name="count")
        gender_hist = cross.dropna().to_dict("records")

    # T/N/M stage distributions
    t_stage = safe_value_counts(rad["clinical.T.Stage"])
    n_stage = safe_value_counts(rad["Clinical.N.Stage"])
    m_stage = safe_value_counts(rad["Clinical.M.Stage"])

    # Survival time histogram
    surv = rad["Survival.time"].dropna()
    survival_hist_data = {
        "values": [round(float(x), 1) for x in surv.tolist()],
        "min": round(float(surv.min()), 1),
        "max": round(float(surv.max()), 1),
        "mean": round(float(surv.mean()), 1),
        "median": round(float(surv.median()), 1),
    }

    # Survival by stage (KM-ready data)
    km_data = []
    for stage in sorted(rad["Overall.Stage"].dropna().unique()):
        grp = rad[rad["Overall.Stage"] == stage][["Survival.time", "deadstatus.event"]].dropna()
        km_data.append({
            "stage": str(stage),
            "n": int(len(grp)),
            "events": int(grp["deadstatus.event"].sum()),
            "median_survival": round(float(grp["Survival.time"].median()), 1),
            "times": sorted([round(float(x), 1) for x in grp["Survival.time"].tolist()]),
            "events_list": [int(x) for x in grp.sort_values("Survival.time")["deadstatus.event"].tolist()]
        })

    # Correlation matrix for numeric columns
    numeric_cols = ["age", "Survival.time", "deadstatus.event"]
    corr = rad[numeric_cols].corr().round(4)
    corr_data = {
        "columns": numeric_cols,
        "matrix": corr.values.tolist()
    }

    return {
        "source": "NSCLC-Radiomics (Lung1)",
        "total_records": int(len(rad)),
        "age_by_stage": age_by_stage,
        "gender_histology": gender_hist,
        "t_stage_distribution": [{"stage": f"T{k}", "count": v} for k, v in t_stage.items()],
        "n_stage_distribution": [{"stage": f"N{k}", "count": v} for k, v in n_stage.items()],
        "m_stage_distribution": [{"stage": f"M{k}", "count": v} for k, v in m_stage.items()],
        "overall_stage_distribution": [
            {"stage": k, "count": v}
            for k, v in safe_value_counts(rad["Overall.Stage"]).items()
        ],
        "survival_histogram": survival_hist_data,
        "kaplan_meier_data": km_data,
        "correlation_matrix": corr_data,
    }


# ─── TREATMENT ANALYTICS ──────────────────────────────────────────────────────

def get_treatment_analytics() -> Dict[str, Any]:
    """Treatment analytics from NSCLC Radiogenomics."""
    rg = load_nsclc_radiogenomics()

    # Treatment frequency
    chemo = safe_value_counts(rg["chemotherapy"]) if "chemotherapy" in rg.columns else {}
    radiation = safe_value_counts(rg["radiation"]) if "radiation" in rg.columns else {}
    recurrence = safe_value_counts(rg["recurrence"]) if "recurrence" in rg.columns else {}
    survival = safe_value_counts(rg["survival_status"]) if "survival_status" in rg.columns else {}

    # Biomarker distributions
    egfr = safe_value_counts(rg["egfr_status"]) if "egfr_status" in rg.columns else {}
    kras = safe_value_counts(rg["kras_status"]) if "kras_status" in rg.columns else {}
    alk = safe_value_counts(rg["alk_status"]) if "alk_status" in rg.columns else {}
    smoking = safe_value_counts(rg["smoking_status"]) if "smoking_status" in rg.columns else {}

    # Treatment combinations
    if "chemotherapy" in rg.columns and "radiation" in rg.columns:
        rg["treatment_combo"] = rg["chemotherapy"].astype(str) + " + " + rg["radiation"].astype(str)
        combo = safe_value_counts(rg["treatment_combo"])
    else:
        combo = {}

    # Histology distribution
    hist = safe_value_counts(rg["histology"]) if "histology" in rg.columns else {}

    # Chemo vs histology
    chemo_hist = []
    if "chemotherapy" in rg.columns and "histology" in rg.columns:
        cross = rg.groupby(["histology", "chemotherapy"]).size().reset_index(name="count")
        chemo_hist = cross.dropna().to_dict("records")

    # Survival by chemo
    surv_by_chemo = {}
    if "chemotherapy" in rg.columns and "time_to_death_days" in rg.columns:
        for chemo_val in rg["chemotherapy"].dropna().unique():
            grp = rg[rg["chemotherapy"] == chemo_val]["time_to_death_days"].dropna()
            if len(grp) > 0:
                surv_by_chemo[str(chemo_val)] = {
                    "n": int(len(grp)),
                    "median_days": round(float(grp.median()), 1),
                    "values": sorted([round(float(x), 1) for x in grp.tolist()])
                }

    # Recurrence location
    recurrence_loc = safe_value_counts(rg["recurrence_location"]) if "recurrence_location" in rg.columns else {}

    # Follow-up histogram
    followup = rg["time_to_death_days"].dropna()
    followup_hist = {
        "values": [round(float(x), 1) for x in followup.tolist()],
        "min": round(float(followup.min()), 1) if len(followup) > 0 else 0,
        "max": round(float(followup.max()), 1) if len(followup) > 0 else 0,
        "mean": round(float(followup.mean()), 1) if len(followup) > 0 else 0,
    }

    return {
        "source": "NSCLC Radiogenomics",
        "total_records": int(len(rg)),
        "disclaimer": "Observational data only. Treatment distributions do not establish causal treatment effectiveness.",
        "treatment_frequency": {
            "chemotherapy": [{"treatment": "Chemotherapy " + k, "count": v} for k, v in chemo.items()],
            "radiation": [{"treatment": "Radiation " + k, "count": v} for k, v in radiation.items()],
        },
        "treatment_combinations": [{"combo": k, "count": v} for k, v in combo.items()],
        "recurrence": [{"status": k, "count": v} for k, v in recurrence.items()],
        "recurrence_location": [{"location": k, "count": v} for k, v in recurrence_loc.items()],
        "survival_status": [{"status": k, "count": v} for k, v in survival.items()],
        "biomarkers": {
            "egfr": [{"status": k, "count": v} for k, v in egfr.items()],
            "kras": [{"status": k, "count": v} for k, v in kras.items()],
            "alk": [{"status": k, "count": v} for k, v in alk.items()],
        },
        "smoking_history": [{"status": k, "count": v} for k, v in smoking.items()],
        "histology": [{"histology": k, "count": v} for k, v in hist.items()],
        "chemo_by_histology": chemo_hist,
        "survival_by_treatment": surv_by_chemo,
        "followup_histogram": followup_hist,
    }


# ─── IMAGING ANALYTICS ────────────────────────────────────────────────────────

def get_imaging_overview() -> Dict[str, Any]:
    """Overview stats for NoduleMNIST3D."""
    nm = load_nodule_mnist()
    tl = nm["train_labels"]
    vl = nm["val_labels"]
    tel = nm["test_labels"]
    all_labels = np.concatenate([tl, vl, tel])
    all_imgs = np.concatenate([nm["train_images"], nm["val_images"], nm["test_images"]])

    # Intensity distribution
    flat = all_imgs.flatten()
    hist_counts, hist_bins = np.histogram(flat, bins=50, range=(0, 255))

    return {
        "source": "NoduleMNIST3D (MedMNIST v2)",
        "disclaimer": "Low-resolution research dataset (28x28x28 voxels). NOT diagnostic quality. NOT paired with NSCLC clinical records.",
        "total_samples": int(len(all_labels)),
        "splits": {
            "train": {"total": int(len(tl)), "benign": int((tl == 0).sum()), "malignant": int((tl == 1).sum())},
            "val": {"total": int(len(vl)), "benign": int((vl == 0).sum()), "malignant": int((vl == 1).sum())},
            "test": {"total": int(len(tel)), "benign": int((tel == 0).sum()), "malignant": int((tel == 1).sum())},
        },
        "class_distribution": {
            "Benign": int((all_labels == 0).sum()),
            "Malignant": int((all_labels == 1).sum()),
        },
        "image_stats": {
            "shape": [28, 28, 28],
            "dtype": "uint8",
            "min": int(all_imgs.min()),
            "max": int(all_imgs.max()),
            "mean": round(float(all_imgs.mean()), 2),
            "std": round(float(all_imgs.std()), 2),
        },
        "intensity_histogram": {
            "bins": [round(float(b), 2) for b in hist_bins[:-1].tolist()],
            "counts": [int(c) for c in hist_counts.tolist()],
        }
    }


def get_sample_image(sample_id: int, split: str = "test") -> Dict[str, Any]:
    """Get a specific imaging sample."""
    nm = load_nodule_mnist()
    images_key = f"{split}_images"
    labels_key = f"{split}_labels"

    if images_key not in nm:
        return {"error": f"Invalid split: {split}"}

    images = nm[images_key]
    labels = nm[labels_key]

    if sample_id < 0 or sample_id >= len(images):
        return {"error": f"Sample ID {sample_id} out of range [0, {len(images)-1}]"}

    img = images[sample_id]  # (28, 28, 28)
    label = int(labels[sample_id])

    # Get middle slices (depth dimension = axis 0)
    depth = img.shape[0]  # 28
    mid = depth // 2

    # Three equidistant slices along depth axis
    slices = {
        "slice_25pct": img[depth // 4].tolist(),
        "slice_50pct": img[mid].tolist(),
        "slice_75pct": img[3 * depth // 4].tolist(),
    }

    return {
        "sample_id": sample_id,
        "split": split,
        "label": label,
        "label_name": "Malignant" if label == 1 else "Benign",
        "shape": list(img.shape),
        "dtype": "uint8",
        "stats": {
            "min": int(img.min()),
            "max": int(img.max()),
            "mean": round(float(img.mean()), 2),
            "std": round(float(img.std()), 2),
            "nonzero_voxels": int((img > 0).sum()),
        },
        "slices": slices,
        "total_in_split": int(len(images)),
    }


def get_imaging_samples_list(split: str = "test", limit: int = 50) -> Dict[str, Any]:
    """Get list of imaging samples for browsing."""
    nm = load_nodule_mnist()
    images_key = f"{split}_images"
    labels_key = f"{split}_labels"

    if images_key not in nm:
        return {"error": f"Invalid split: {split}"}

    images = nm[images_key]
    labels = nm[labels_key]

    n = min(limit, len(images))
    samples = []
    for i in range(n):
        img = images[i]
        samples.append({
            "sample_id": i,
            "label": int(labels[i]),
            "label_name": "Malignant" if labels[i] == 1 else "Benign",
            "mean_intensity": round(float(img.mean()), 2),
            "max_intensity": int(img.max()),
        })

    return {
        "split": split,
        "total_in_split": int(len(images)),
        "returned": n,
        "samples": samples
    }

