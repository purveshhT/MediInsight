"""
Dataset loaders — load and cache all datasets
"""

import numpy as np
import pandas as pd
import json
import os
from functools import lru_cache
from typing import Optional, Dict, Any
from app.utils.config import (
    NODULE_MNIST_PATH, NSCLC_RADIOMICS_PATH,
    NSCLC_RADIOGENOMICS_PATH, TCIA_DIAGNOSIS_PATH,
    IQ_OTHNCCD_MANIFEST_PATH, CHEST_CT_SUBTYPES_MANIFEST_PATH,
    DATA_PROCESSED_DIR
)


@lru_cache(maxsize=1)
def load_nodule_mnist() -> Dict[str, np.ndarray]:
    """Load NoduleMNIST3D from NPZ file. Returns dict of arrays."""
    data = np.load(NODULE_MNIST_PATH)
    return {
        "train_images": data["train_images"],   # (1158, 28, 28, 28) uint8
        "train_labels": data["train_labels"].flatten(),  # (1158,)
        "val_images": data["val_images"],
        "val_labels": data["val_labels"].flatten(),
        "test_images": data["test_images"],
        "test_labels": data["test_labels"].flatten(),
    }


@lru_cache(maxsize=1)
def load_nsclc_radiomics() -> pd.DataFrame:
    """Load and clean NSCLC-Radiomics clinical data."""
    df = pd.read_csv(NSCLC_RADIOMICS_PATH)

    # Standardize column names
    df.columns = [c.strip() for c in df.columns]

    # Convert age to numeric
    df["age"] = pd.to_numeric(df["age"], errors="coerce")
    df["Survival.time"] = pd.to_numeric(df["Survival.time"], errors="coerce")
    df["deadstatus.event"] = pd.to_numeric(df["deadstatus.event"], errors="coerce")

    # Map stages to display values
    df["clinical.T.Stage"] = df["clinical.T.Stage"].astype(str)
    df["Clinical.N.Stage"] = df["Clinical.N.Stage"].astype(str)
    df["Clinical.M.Stage"] = df["Clinical.M.Stage"].astype(str)

    # Clean NA strings
    for col in ["Overall.Stage", "Histology", "gender"]:
        df[col] = df[col].replace("NA", pd.NA)

    return df


@lru_cache(maxsize=1)
def load_nsclc_radiogenomics() -> pd.DataFrame:
    """Load and clean NSCLC Radiogenomics clinical data."""
    df = pd.read_csv(NSCLC_RADIOGENOMICS_PATH)

    # Standardize column names
    df.columns = [c.strip() for c in df.columns]

    # Rename for easier access
    rename_map = {
        "Case ID": "case_id",
        "Age at Histological Diagnosis": "age",
        "Weight (lbs)": "weight_lbs",
        "Gender": "gender",
        "Ethnicity": "ethnicity",
        "Smoking status": "smoking_status",
        "Pack Years": "pack_years",
        "Quit Smoking Year": "quit_smoking_year",
        "%GG": "percent_gg",
        "Histology ": "histology",
        "Histology": "histology",
        "Pathological T stage": "path_t_stage",
        "Pathological N stage": "path_n_stage",
        "Pathological M stage": "path_m_stage",
        "Histopathological Grade": "hist_grade",
        "Lymphovascular invasion": "lymphovascular_invasion",
        "Pleural invasion (elastic, visceral, or parietal)": "pleural_invasion",
        "EGFR mutation status": "egfr_status",
        "KRAS mutation status": "kras_status",
        "ALK translocation status": "alk_status",
        "Adjuvant Treatment": "adjuvant_treatment",
        "Chemotherapy": "chemotherapy",
        "Radiation": "radiation",
        "Recurrence": "recurrence",
        "Recurrence Location": "recurrence_location",
        "Date of Recurrence": "date_recurrence",
        "Date of Last Known Alive": "date_last_known_alive",
        "Survival Status": "survival_status",
        "Date of Death": "date_death",
        "Time to Death (days)": "time_to_death_days",
        "CT Date": "ct_date",
        "Days between CT and surgery": "days_ct_to_surgery",
        "PET Date": "pet_date",
        "Patient affiliation": "institution",
    }
    df.rename(columns=rename_map, inplace=True)

    # Convert numeric fields
    df["age"] = pd.to_numeric(df["age"], errors="coerce")
    df["time_to_death_days"] = pd.to_numeric(df["time_to_death_days"], errors="coerce")
    df["days_ct_to_surgery"] = pd.to_numeric(df["days_ct_to_surgery"], errors="coerce")

    # Standardize missing value markers
    not_collected_vals = ["Not Collected", "Not collected", "Not Assessed", "N/A", ""]
    for col in df.columns:
        df[col] = df[col].replace(not_collected_vals, pd.NA)

    return df


@lru_cache(maxsize=1)
def load_tcia_diagnosis() -> pd.DataFrame:
    """Load TCIA diagnosis XLS data."""
    try:
        # Try openpyxl first (xlsx-compatible mode for old xls)
        df = pd.read_excel(TCIA_DIAGNOSIS_PATH, engine="xlrd")
    except Exception:
        try:
            df = pd.read_excel(TCIA_DIAGNOSIS_PATH, engine="openpyxl")
        except Exception as e:
            # Return empty DataFrame with note
            return pd.DataFrame({"error": [f"Could not load TCIA XLS: {str(e)}"]})
    return df


@lru_cache(maxsize=1)
def load_iq_othnccd() -> pd.DataFrame:
    """Load IQ-OTH/NCCD Lung Cancer CT dataset manifest."""
    if os.path.exists(IQ_OTHNCCD_MANIFEST_PATH):
        return pd.read_csv(IQ_OTHNCCD_MANIFEST_PATH)
    return pd.DataFrame()


@lru_cache(maxsize=1)
def load_chest_ct_subtypes() -> pd.DataFrame:
    """Load Chest CT-Scan Cancer Subtypes benchmark manifest."""
    if os.path.exists(CHEST_CT_SUBTYPES_MANIFEST_PATH):
        return pd.read_csv(CHEST_CT_SUBTYPES_MANIFEST_PATH)
    return pd.DataFrame()


def get_dataset_stats() -> Dict[str, Any]:
    """Get basic stats for all datasets."""
    stats = {}

    try:
        nm = load_nodule_mnist()
        total = len(nm["train_labels"]) + len(nm["val_labels"]) + len(nm["test_labels"])
        stats["nodulemnist3d"] = {
            "total_samples": int(total),
            "train": int(len(nm["train_labels"])),
            "val": int(len(nm["val_labels"])),
            "test": int(len(nm["test_labels"])),
            "class_dist_train": {
                "Benign": int((nm["train_labels"] == 0).sum()),
                "Malignant": int((nm["train_labels"] == 1).sum())
            }
        }
    except Exception as e:
        stats["nodulemnist3d"] = {"error": str(e)}

    try:
        rad = load_nsclc_radiomics()
        stats["nsclc_radiomics"] = {
            "total_records": int(len(rad)),
            "columns": int(len(rad.columns)),
            "missing_values": int(rad.isnull().sum().sum())
        }
    except Exception as e:
        stats["nsclc_radiomics"] = {"error": str(e)}

    try:
        rg = load_nsclc_radiogenomics()
        stats["nsclc_radiogenomics"] = {
            "total_records": int(len(rg)),
            "columns": int(len(rg.columns)),
            "missing_values": int(rg.isnull().sum().sum())
        }
    except Exception as e:
        stats["nsclc_radiogenomics"] = {"error": str(e)}

    try:
        tcia = load_tcia_diagnosis()
        stats["tcia_diagnosis"] = {
            "total_records": int(len(tcia)),
            "columns": int(len(tcia.columns))
        }
    except Exception as e:
        stats["tcia_diagnosis"] = {"error": str(e)}

    try:
        iq = load_iq_othnccd()
        stats["iq_othnccd"] = {
            "total_records": int(len(iq)),
            "columns": int(len(iq.columns)),
            "classes": iq["class_label"].value_counts().to_dict() if "class_label" in iq.columns else {}
        }
    except Exception as e:
        stats["iq_othnccd"] = {"error": str(e)}

    try:
        chest = load_chest_ct_subtypes()
        stats["chest_ct_subtypes"] = {
            "total_records": int(len(chest)),
            "columns": int(len(chest.columns)),
            "histology_breakdown": chest["histology"].value_counts().to_dict() if "histology" in chest.columns else {},
            "split_breakdown": chest["split"].value_counts().to_dict() if "split" in chest.columns else {}
        }
    except Exception as e:
        stats["chest_ct_subtypes"] = {"error": str(e)}

    return stats

