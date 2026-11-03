"""
Data quality and profiling service
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List
from app.services.data_loader import (
    load_nsclc_radiomics, load_nsclc_radiogenomics,
    load_tcia_diagnosis, load_nodule_mnist,
    load_iq_othnccd, load_chest_ct_subtypes
)


def profile_dataframe(df: pd.DataFrame, dataset_name: str) -> Dict[str, Any]:
    """Generate a comprehensive data quality profile for a DataFrame."""
    profile = {
        "dataset_name": dataset_name,
        "total_records": int(len(df)),
        "total_columns": int(len(df.columns)),
        "duplicate_rows": int(df.duplicated().sum()),
        "missing_values_total": int(df.isnull().sum().sum()),
        "columns": []
    }

    for col in df.columns:
        series = df[col]
        missing_count = int(series.isnull().sum())
        missing_pct = round(missing_count / len(df) * 100, 2) if len(df) > 0 else 0.0

        col_info = {
            "name": col,
            "dtype": str(series.dtype),
            "missing_count": missing_count,
            "missing_pct": missing_pct,
            "unique_values": int(series.nunique()),
        }

        if pd.api.types.is_numeric_dtype(series):
            col_info["stats"] = {
                "min": round(float(series.min()), 4) if not series.isnull().all() else None,
                "max": round(float(series.max()), 4) if not series.isnull().all() else None,
                "mean": round(float(series.mean()), 4) if not series.isnull().all() else None,
                "median": round(float(series.median()), 4) if not series.isnull().all() else None,
                "std": round(float(series.std()), 4) if not series.isnull().all() else None,
            }
        else:
            top_values = series.value_counts().head(5).to_dict()
            col_info["top_values"] = {str(k): int(v) for k, v in top_values.items()}

        profile["columns"].append(col_info)

    return profile


def get_full_quality_report() -> Dict[str, Any]:
    """Generate quality reports for all datasets."""
    report = {}

    try:
        rad = load_nsclc_radiomics()
        report["nsclc_radiomics"] = profile_dataframe(rad, "NSCLC-Radiomics (Lung1)")
    except Exception as e:
        report["nsclc_radiomics"] = {"error": str(e)}

    try:
        rg = load_nsclc_radiogenomics()
        report["nsclc_radiogenomics"] = profile_dataframe(rg, "NSCLC Radiogenomics")
    except Exception as e:
        report["nsclc_radiogenomics"] = {"error": str(e)}

    try:
        tcia = load_tcia_diagnosis()
        if "error" not in tcia.columns:
            report["tcia_diagnosis"] = profile_dataframe(tcia, "TCIA Diagnosis Data")
        else:
            report["tcia_diagnosis"] = {"error": "Could not load XLS file"}
    except Exception as e:
        report["tcia_diagnosis"] = {"error": str(e)}

    # NoduleMNIST3D summary (no dataframe)
    try:
        nm = load_nodule_mnist()
        tl = nm["train_labels"]
        vl = nm["val_labels"]
        tel = nm["test_labels"]
        train_imgs = nm["train_images"]
        report["nodulemnist3d"] = {
            "dataset_name": "NoduleMNIST3D",
            "format": "NPZ (NumPy compressed array)",
            "total_samples": int(len(tl) + len(vl) + len(tel)),
            "train_samples": int(len(tl)),
            "val_samples": int(len(vl)),
            "test_samples": int(len(tel)),
            "image_shape": list(train_imgs.shape[1:]),
            "image_dtype": str(train_imgs.dtype),
            "pixel_min": int(train_imgs.min()),
            "pixel_max": int(train_imgs.max()),
            "pixel_mean": round(float(train_imgs.mean()), 2),
            "pixel_std": round(float(train_imgs.std()), 2),
            "class_distribution": {
                "train": {"Benign (0)": int((tl == 0).sum()), "Malignant (1)": int((tl == 1).sum())},
                "val": {"Benign (0)": int((vl == 0).sum()), "Malignant (1)": int((vl == 1).sum())},
                "test": {"Benign (0)": int((tel == 0).sum()), "Malignant (1)": int((tel == 1).sum())},
            },
            "class_imbalance_ratio_train": round(float((tl == 0).sum() / (tl == 1).sum()), 2),
            "missing_values": 0,
            "duplicate_samples": 0,
        }
    except Exception as e:
        report["nodulemnist3d"] = {"error": str(e)}

    # IQ-OTH/NCCD dataset quality profile
    try:
        iq = load_iq_othnccd()
        if len(iq) > 0:
            report["iq_othnccd"] = profile_dataframe(iq, "IQ-OTH/NCCD Lung Cancer Dataset")
    except Exception as e:
        report["iq_othnccd"] = {"error": str(e)}

    # Chest CT Subtypes dataset quality profile
    try:
        chest = load_chest_ct_subtypes()
        if len(chest) > 0:
            report["chest_ct_subtypes"] = profile_dataframe(chest, "Chest CT-Scan Cancer Subtypes")
    except Exception as e:
        report["chest_ct_subtypes"] = {"error": str(e)}

    return report

