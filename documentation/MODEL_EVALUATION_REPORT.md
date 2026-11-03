# MediInsight AI: Model Evaluation & Performance Benchmark Report

## 1. Nodule Classifier Test Set Benchmarks

The 3D CT Nodule Classifier was evaluated on the official, held-out NoduleMNIST3D test partition ($n = 310$ independent volumes).

| Metric | Score | Clinical Context |
|---|---|---|
| **Area Under ROC Curve (ROC-AUC)** | **0.8941** (89.41%) | High discriminatory ability between benign and malignant lesions |
| **Overall Accuracy** | **0.8677** (86.77%) | 269 of 310 test volumes correctly classified |
| **Sensitivity / Recall (Malignant)** | **0.7656** (76.56%) | 49 of 64 malignant nodules identified |
| **Specificity (Benign)** | **0.8943** (89.43%) | 220 of 246 benign nodules correctly cleared |
| **Precision (Malignant)** | **0.6533** (65.33%) | Positive predictive value reflecting class imbalance |
| **F1-Score (Malignant)** | **0.7050** (70.50%) | Harmonic mean of precision and recall |

---

## 2. Test Set Confusion Matrix ($n=310$)

```
                     PREDICTED BENIGN    PREDICTED MALIGNANT
ACTUAL BENIGN               220 (TN)               26 (FP)
ACTUAL MALIGNANT             15 (FN)               49 (TP)
```
* **True Negatives (TN):** 220 benign nodules correctly classified.
* **True Positives (TP):** 49 malignant nodules correctly identified.
* **False Positives (FP):** 26 benign nodules flagged for further radiological review.
* **False Negatives (FN):** 15 malignant nodules misclassified as benign.

---

## 3. Radiomic Feature Importance Ranking (Top 8)

| Rank | Feature Identifier | Gini Split Importance | Anatomical Interpretation |
|---|---|---|---|
| 1 | `mean_intensity` | **0.1684** | Overall CT radiodensity of the nodule |
| 2 | `center_mean` | **0.1412** | Density of the solid central nodule core |
| 3 | `percentile_90` | **0.1195** | Presence of high-attenuation calcifications or soft tissue |
| 4 | `total_intensity` | **0.0981** | Total nodule volume and radiopacity |
| 5 | `high_intensity_frac` | **0.0874** | Solid tumor component fraction |
| 6 | `variance` | **0.0762** | Internal tissue heterogeneity |
| 7 | `gradient_z` | **0.0655** | Axial edge sharpness and spiculation |
| 8 | `slice_std` | **0.0541** | Volumetric shape regularity across slices |

