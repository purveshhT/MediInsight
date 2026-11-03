"""
Kaplan-Meier survival analysis using lifelines
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from app.services.data_loader import load_nsclc_radiomics, load_nsclc_radiogenomics


def compute_km_curve(times: List[float], events: List[int]) -> Dict[str, Any]:
    """
    Compute a basic Kaplan-Meier survival curve.
    Returns timeline and survival probability arrays.
    """
    try:
        from lifelines import KaplanMeierFitter
        kmf = KaplanMeierFitter()
        kmf.fit(times, event_observed=events)

        timeline = [round(float(t), 1) for t in kmf.survival_function_.index.tolist()]
        survival = [round(float(s), 4) for s in kmf.survival_function_["KM_estimate"].tolist()]

        # Confidence intervals
        ci_lower = [round(float(s), 4) for s in kmf.confidence_interval_["KM_estimate_lower_0.95"].tolist()]
        ci_upper = [round(float(s), 4) for s in kmf.confidence_interval_["KM_estimate_upper_0.95"].tolist()]

        return {
            "timeline": timeline,
            "survival_probability": survival,
            "ci_lower": ci_lower,
            "ci_upper": ci_upper,
            "median_survival": float(kmf.median_survival_time_) if not np.isnan(kmf.median_survival_time_) else None,
            "n_events": int(sum(events)),
            "n_total": int(len(times)),
        }
    except Exception as e:
        # Fallback: simple step function
        return {"error": str(e), "n_total": len(times), "n_events": sum(events)}


def get_survival_by_stage() -> Dict[str, Any]:
    """KM curves stratified by cancer stage from NSCLC-Radiomics."""
    rad = load_nsclc_radiomics()
    df = rad.dropna(subset=["Overall.Stage", "Survival.time", "deadstatus.event"])

    result = {}
    for stage in sorted(df["Overall.Stage"].unique()):
        grp = df[df["Overall.Stage"] == stage]
        times = grp["Survival.time"].tolist()
        events = grp["deadstatus.event"].astype(int).tolist()
        result[str(stage)] = {
            "n": int(len(grp)),
            "km": compute_km_curve(times, events),
        }

    return {
        "source": "NSCLC-Radiomics (Lung1)",
        "by_stage": result,
        "disclaimer": "Kaplan-Meier curves show observed survival in this dataset. Differences between groups should not be interpreted as treatment effects.",
    }


def get_survival_by_gender() -> Dict[str, Any]:
    """KM curves stratified by gender."""
    rad = load_nsclc_radiomics()
    df = rad.dropna(subset=["gender", "Survival.time", "deadstatus.event"])

    result = {}
    for gender in df["gender"].unique():
        grp = df[df["gender"] == gender]
        times = grp["Survival.time"].tolist()
        events = grp["deadstatus.event"].astype(int).tolist()
        result[str(gender)] = {
            "n": int(len(grp)),
            "km": compute_km_curve(times, events),
        }

    return {
        "source": "NSCLC-Radiomics (Lung1)",
        "by_gender": result,
    }

