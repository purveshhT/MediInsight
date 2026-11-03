"""
PCA and dimensionality reduction for imaging analytics
"""

import numpy as np
from typing import Dict, Any
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from functools import lru_cache
from app.services.data_loader import load_nodule_mnist
from app.models.nodule_classifier import extract_features


@lru_cache(maxsize=1)
def _get_pca_features():
    """Compute PCA features for the test set (cached)."""
    nm = load_nodule_mnist()
    test_images = nm["test_images"]
    test_labels = nm["test_labels"]

    features = extract_features(test_images)
    scaler = StandardScaler()
    features_s = scaler.fit_transform(features)

    pca = PCA(n_components=3, random_state=42)
    pca_coords = pca.fit_transform(features_s)

    return pca_coords, test_labels, pca.explained_variance_ratio_


def get_pca_projection() -> Dict[str, Any]:
    """Get PCA projection of imaging features for scatter plot."""
    pca_coords, labels, evr = _get_pca_features()

    points = []
    for i, (coord, label) in enumerate(zip(pca_coords, labels)):
        points.append({
            "id": i,
            "pc1": round(float(coord[0]), 4),
            "pc2": round(float(coord[1]), 4),
            "pc3": round(float(coord[2]), 4),
            "label": int(label),
            "label_name": "Malignant" if label == 1 else "Benign",
        })

    return {
        "source": "NoduleMNIST3D test set (310 samples)",
        "method": "PCA on 20 hand-crafted statistical features",
        "explained_variance_ratio": [round(float(v), 4) for v in evr.tolist()],
        "total_variance_explained": round(float(evr.sum()), 4),
        "points": points,
        "class_colors": {"Benign": "#22d3ee", "Malignant": "#f97316"},
    }

