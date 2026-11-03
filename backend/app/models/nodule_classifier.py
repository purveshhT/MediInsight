"""
Nodule classifier using a lightweight numpy-based approach.
Trains a simple model on extracted image features.
"""

import numpy as np
import os
import json
from functools import lru_cache
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, confusion_matrix, classification_report
)
import joblib
from app.services.data_loader import load_nodule_mnist
from app.utils.config import ML_MODELS_DIR, ML_EVAL_DIR


MODEL_PATH = os.path.join(ML_MODELS_DIR, "nodule_classifier.pkl")
SCALER_PATH = os.path.join(ML_MODELS_DIR, "nodule_scaler.pkl")
FEATURES_TRAIN_PATH = os.path.join(ML_MODELS_DIR, "train_features.npy")
FEATURES_TEST_PATH = os.path.join(ML_MODELS_DIR, "test_features.npy")
EVAL_PATH = os.path.join(ML_EVAL_DIR, "nodule_classifier_eval.json")


def extract_features(images: np.ndarray) -> np.ndarray:
    """
    Extract hand-crafted features from 3D CT volumes.
    Uses statistical and spatial features — no PyTorch required.
    """
    features = []
    for img in images:
        img_f = img.astype(np.float32) / 255.0
        feat = [
            float(img_f.mean()),
            float(img_f.std()),
            float(img_f.min()),
            float(img_f.max()),
            float(np.percentile(img_f, 25)),
            float(np.percentile(img_f, 75)),
            float(np.percentile(img_f, 90)),
            float(np.percentile(img_f, 10)),
            float((img_f > 0.5).mean()),     # high intensity fraction
            float((img_f > 0.2).mean()),     # medium intensity fraction
            float((img_f < 0.1).mean()),     # low/background fraction
            # Center region statistics (core nodule region)
            float(img_f[10:18, 10:18, 10:18].mean()),
            float(img_f[10:18, 10:18, 10:18].std()),
            float(img_f[10:18, 10:18, 10:18].max()),
            # Per-slice mean (averaged across depth)
            float(img_f.mean(axis=(1, 2)).std()),
            # Gradient approximation (simple difference)
            float(np.abs(np.diff(img_f, axis=0)).mean()),
            float(np.abs(np.diff(img_f, axis=1)).mean()),
            float(np.abs(np.diff(img_f, axis=2)).mean()),
            # Shape-based
            float(img_f.sum()),
            float(np.var(img_f)),
        ]
        features.append(feat)
    return np.array(features, dtype=np.float32)


def train_nodule_classifier() -> dict:
    """Train a Random Forest classifier on extracted image features."""
    nm = load_nodule_mnist()

    print("Extracting training features...")
    X_train = extract_features(nm["train_images"])
    y_train = nm["train_labels"]

    print("Extracting validation features...")
    X_val = extract_features(nm["val_images"])
    y_val = nm["val_labels"]

    print("Extracting test features...")
    X_test = extract_features(nm["test_images"])
    y_test = nm["test_labels"]

    # Scale features
    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_val_s = scaler.transform(X_val)
    X_test_s = scaler.transform(X_test)

    # Class weights to handle imbalance (863 benign vs 295 malignant)
    class_weight = {0: 1.0, 1: 863.0 / 295.0}

    # Train Random Forest
    print("Training Random Forest classifier...")
    clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        class_weight=class_weight,
        random_state=42,
        n_jobs=-1
    )
    clf.fit(X_train_s, y_train)

    # Evaluate on validation
    val_pred = clf.predict(X_val_s)
    val_proba = clf.predict_proba(X_val_s)[:, 1]
    val_metrics = {
        "accuracy": round(accuracy_score(y_val, val_pred), 4),
        "precision": round(precision_score(y_val, val_pred, zero_division=0), 4),
        "recall": round(recall_score(y_val, val_pred, zero_division=0), 4),
        "f1": round(f1_score(y_val, val_pred, zero_division=0), 4),
        "roc_auc": round(roc_auc_score(y_val, val_proba), 4),
        "confusion_matrix": confusion_matrix(y_val, val_pred).tolist(),
    }

    # Evaluate on test
    test_pred = clf.predict(X_test_s)
    test_proba = clf.predict_proba(X_test_s)[:, 1]
    test_metrics = {
        "accuracy": round(accuracy_score(y_test, test_pred), 4),
        "precision": round(precision_score(y_test, test_pred, zero_division=0), 4),
        "recall": round(recall_score(y_test, test_pred, zero_division=0), 4),
        "f1": round(f1_score(y_test, test_pred, zero_division=0), 4),
        "roc_auc": round(roc_auc_score(y_test, test_proba), 4),
        "confusion_matrix": confusion_matrix(y_test, test_pred).tolist(),
        "classification_report": classification_report(y_test, test_pred, target_names=["Benign", "Malignant"], output_dict=True),
    }

    # Feature importances
    feature_names = [
        "mean_intensity", "std_intensity", "min_intensity", "max_intensity",
        "percentile_25", "percentile_75", "percentile_90", "percentile_10",
        "high_intensity_frac", "medium_intensity_frac", "background_frac",
        "center_mean", "center_std", "center_max",
        "slice_std", "gradient_x", "gradient_y", "gradient_z",
        "total_intensity", "variance"
    ]
    importances = clf.feature_importances_
    feature_importance = sorted(
        [{"feature": fn, "importance": round(float(imp), 4)} for fn, imp in zip(feature_names, importances)],
        key=lambda x: x["importance"], reverse=True
    )

    # Save model
    joblib.dump(clf, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    np.save(FEATURES_TRAIN_PATH, X_train_s)
    np.save(FEATURES_TEST_PATH, X_test_s)

    eval_results = {
        "model": "Random Forest Classifier",
        "approach": "Hand-crafted statistical features from 3D CT volumes",
        "features": feature_names,
        "training_samples": int(len(y_train)),
        "val_samples": int(len(y_val)),
        "test_samples": int(len(y_test)),
        "class_weights": class_weight,
        "validation_metrics": val_metrics,
        "test_metrics": test_metrics,
        "feature_importance": feature_importance,
        "disclaimer": "Research prototype trained on NoduleMNIST3D (28x28x28 low-resolution volumes). Not validated for clinical use.",
    }

    with open(EVAL_PATH, "w") as f:
        json.dump(eval_results, f, indent=2)

    print(f"Model trained. Test AUC: {test_metrics['roc_auc']}")
    return eval_results


@lru_cache(maxsize=1)
def _load_model():
    """Load trained model and scaler."""
    if not os.path.exists(MODEL_PATH):
        return None, None
    clf = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    return clf, scaler


def classify_nodule(sample_id: int, split: str = "test") -> dict:
    """Run inference on a single imaging sample."""
    clf, scaler = _load_model()
    if clf is None:
        return {
            "error": "Model not trained yet. Run /api/models/train first.",
            "trained": False
        }

    nm = load_nodule_mnist()
    images_key = f"{split}_images"
    labels_key = f"{split}_labels"

    if images_key not in nm:
        return {"error": f"Invalid split: {split}"}
    if sample_id < 0 or sample_id >= len(nm[images_key]):
        return {"error": f"Sample ID {sample_id} out of range"}

    img = nm[images_key][sample_id:sample_id+1]
    true_label = int(nm[labels_key][sample_id])

    features = extract_features(img)
    features_s = scaler.transform(features)

    pred = int(clf.predict(features_s)[0])
    proba = clf.predict_proba(features_s)[0]

    return {
        "sample_id": sample_id,
        "split": split,
        "true_label": true_label,
        "true_label_name": "Malignant" if true_label == 1 else "Benign",
        "predicted_label": pred,
        "predicted_label_name": "Malignant" if pred == 1 else "Benign",
        "correct": pred == true_label,
        "probabilities": {
            "Benign": round(float(proba[0]), 4),
            "Malignant": round(float(proba[1]), 4),
        },
        "disclaimer": "Research prototype only. Not for clinical use.",
    }


def get_model_evaluation() -> dict:
    """Get stored evaluation results."""
    if os.path.exists(EVAL_PATH):
        with open(EVAL_PATH) as f:
            return json.load(f)
    return {
        "status": "not_trained",
        "message": "Model has not been trained yet. POST /api/models/train to train."
    }

