"""
Similar case retrieval using sklearn NearestNeighbors
"""

import numpy as np
import os
from functools import lru_cache
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import StandardScaler, LabelEncoder
import pandas as pd
from app.services.data_loader import load_nsclc_radiomics, load_nsclc_radiogenomics, load_nodule_mnist
from app.models.nodule_classifier import extract_features


@lru_cache(maxsize=1)
def _build_clinical_index():
    """Build NearestNeighbors index on NSCLC-Radiomics clinical features."""
    rad = load_nsclc_radiomics()

    # Select features for similarity
    feature_cols = ["age", "clinical.T.Stage", "Clinical.N.Stage", "Clinical.M.Stage"]
    df = rad.copy()

    # Encode categorical
    for col in ["clinical.T.Stage", "Clinical.N.Stage", "Clinical.M.Stage"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    df["gender_enc"] = (df["gender"] == "male").astype(float)
    hist_map = {"squamous cell carcinoma": 0, "adenocarcinoma": 1, "large cell": 2, "nos": 3}
    df["hist_enc"] = df["Histology"].map(hist_map).fillna(-1)

    feature_cols_ext = ["age", "clinical.T.Stage", "Clinical.N.Stage", "Clinical.M.Stage", "gender_enc", "hist_enc"]

    X = df[feature_cols_ext].copy()
    X = X.fillna(X.median(numeric_only=True))

    scaler = StandardScaler()
    X_s = scaler.fit_transform(X)

    nn = NearestNeighbors(n_neighbors=10, metric="euclidean")
    nn.fit(X_s)

    return nn, scaler, df, X_s


def get_similar_clinical_cases(
    age: float,
    gender: str,
    histology: str,
    t_stage: str,
    n_stage: str,
    m_stage: str,
    n_neighbors: int = 5
) -> dict:
    """Find similar clinical cases from NSCLC-Radiomics."""
    try:
        nn, scaler, df, X_s = _build_clinical_index()

        hist_map = {"squamous cell carcinoma": 0, "adenocarcinoma": 1, "large cell": 2, "nos": 3}
        gender_enc = 1.0 if gender.lower() == "male" else 0.0
        hist_enc = hist_map.get(histology.lower(), -1)

        query = np.array([[
            float(age),
            float(t_stage) if t_stage.isdigit() else 0.0,
            float(n_stage) if n_stage.isdigit() else 0.0,
            float(m_stage) if m_stage.isdigit() else 0.0,
            gender_enc,
            float(hist_enc)
        ]])
        query_s = scaler.transform(query)

        distances, indices = nn.kneighbors(query_s, n_neighbors=min(n_neighbors, len(df)))

        similar_cases = []
        for dist, idx in zip(distances[0], indices[0]):
            row = df.iloc[idx]
            similar_cases.append({
                "rank": len(similar_cases) + 1,
                "patient_id": str(row.get("PatientID", f"Case-{idx}")),
                "similarity_score": round(float(1.0 / (1.0 + dist)), 4),
                "distance": round(float(dist), 4),
                "age": float(row["age"]) if pd.notna(row["age"]) else None,
                "gender": str(row.get("gender", "N/A")),
                "histology": str(row.get("Histology", "N/A")),
                "overall_stage": str(row.get("Overall.Stage", "N/A")),
                "t_stage": str(row.get("clinical.T.Stage", "N/A")),
                "n_stage": str(row.get("Clinical.N.Stage", "N/A")),
                "m_stage": str(row.get("Clinical.M.Stage", "N/A")),
                "survival_time": float(row["Survival.time"]) if pd.notna(row.get("Survival.time")) else None,
                "dead_status": int(row["deadstatus.event"]) if pd.notna(row.get("deadstatus.event")) else None,
            })

        return {
            "source": "NSCLC-Radiomics (Lung1)",
            "query": {"age": age, "gender": gender, "histology": histology, "t_stage": t_stage, "n_stage": n_stage, "m_stage": m_stage},
            "n_neighbors": n_neighbors,
            "similar_cases": similar_cases,
            "disclaimer": "Similarity scores are based on Euclidean distance in feature space. Clinical similarity does not imply equivalent prognosis or treatment response.",
        }
    except Exception as e:
        return {"error": str(e)}


def get_similar_imaging_cases(sample_id: int, split: str = "test", n_neighbors: int = 5) -> dict:
    """Find similar imaging cases using feature-based similarity."""
    try:
        nm = load_nodule_mnist()
        images_key = f"{split}_images"
        labels_key = f"{split}_labels"

        if images_key not in nm:
            return {"error": f"Invalid split: {split}"}

        # Use test split as reference index (to avoid data leakage)
        ref_images = nm["test_images"]
        ref_labels = nm["test_labels"]

        # Extract features for all test images and query
        all_features = extract_features(ref_images)
        query_img = nm[images_key][sample_id:sample_id+1]
        query_features = extract_features(query_img)

        scaler = StandardScaler()
        all_f_s = scaler.fit_transform(all_features)
        query_f_s = scaler.transform(query_features)

        nn = NearestNeighbors(n_neighbors=min(n_neighbors + 1, len(ref_images)), metric="euclidean")
        nn.fit(all_f_s)

        distances, indices = nn.kneighbors(query_f_s)

        similar_cases = []
        for dist, idx in zip(distances[0], indices[0]):
            if split == "test" and idx == sample_id:
                continue  # Skip self
            similar_cases.append({
                "rank": len(similar_cases) + 1,
                "sample_id": int(idx),
                "split": "test",
                "similarity_score": round(float(1.0 / (1.0 + dist)), 4),
                "distance": round(float(dist), 4),
                "label": int(ref_labels[idx]),
                "label_name": "Malignant" if ref_labels[idx] == 1 else "Benign",
                "mean_intensity": round(float(ref_images[idx].mean()), 2),
            })
            if len(similar_cases) >= n_neighbors:
                break

        return {
            "query_sample_id": sample_id,
            "query_split": split,
            "query_label": int(nm[labels_key][sample_id]),
            "query_label_name": "Malignant" if nm[labels_key][sample_id] == 1 else "Benign",
            "n_neighbors": n_neighbors,
            "similar_cases": similar_cases,
            "disclaimer": "Imaging similarity is based on statistical image features, not clinical pathology. Does not imply equivalent clinical outcome.",
        }
    except Exception as e:
        return {"error": str(e)}

