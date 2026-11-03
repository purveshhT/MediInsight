# MediInsight AI: Machine Learning & Recommender Systems Methodology

## 1. Machine Learning Overview

MediInsight AI incorporates two distinct machine learning paradigms:
1. **Supervised Binary Classification (3D CT Nodule Malignancy):** Differentiating benign versus malignant nodules using volumetric radiomic features.
2. **Instance-Based Case-Based Recommender System (k-NN Retrieval):** Finding clinically analogous patients from historical cohorts based on multi-dimensional clinical feature vectors.

---

## 2. Model A: Volumetric Nodule Classifier

### 2.1 Feature Engineering Pipeline (3D CT Volumes)
Given a $28 \times 28 \times 28$ grayscale volume $V$:
* **Global Intensity Statistics:** Mean intensity, standard deviation, minimum, maximum, and percentiles (10th, 25th, 75th, 90th).
* **Voxel Density Fractions:** Fraction of voxels $>0.5$ (high density calcifications/solid components), $>0.2$ (ground-glass opacity), $<0.1$ (aerated lung parenchyma).
* **Nodule Core Extraction:** Central bounding box $V[10:18, 10:18, 10:18]$ mean, standard deviation, and peak intensity.
* **Spatial Gradient Approximations:** Mean finite difference gradients across all three spatial axes:
  $$\nabla_x = \frac{1}{|V|} \sum |V_{i+1, j, k} - V_{i, j, k}|, \quad \nabla_y = \frac{1}{|V|} \sum |V_{i, j+1, k} - V_{i, j, k}|, \quad \nabla_z = \frac{1}{|V|} \sum |V_{i, j, k+1} - V_{i, j, k}|$$
* **Slice-to-Slice Variance:** Standard deviation of axial slice mean intensities to capture axial heterogeneity.

### 2.2 Model Architecture & Training Protocol
* **Classifier:** Random Forest Ensemble (100 Decision Trees, maximum tree depth = 10).
* **Class Weighting:** $w_0 = 1.0, w_1 = \frac{863}{295} \approx 2.93$ applied to penalize false negatives on the minority malignant class.
* **Feature Scaling:** `StandardScaler` fitted exclusively on training set ($X_{\text{train}}$) to prevent data leakage.
* **Training Time:** Sub-20 seconds on modern multicore CPU.

---

## 3. Model B: Similar Case Retrieval (k-NN Engine)

### 3.1 Feature Representation
Patients in NSCLC-Radiomics are mapped into a standardized 6-dimensional feature vector:
$$\mathbf{x} = [\text{Age}, \text{T-Stage}, \text{N-Stage}, \text{M-Stage}, \text{Gender}_{\text{enc}}, \text{Histology}_{\text{enc}}]^T$$

### 3.2 Distance Metric & Similarity Mapping
Euclidean distance $d(\mathbf{u}, \mathbf{v})$ in z-score standardized space:
$$d(\mathbf{u}, \mathbf{v}) = \sqrt{\sum_{k=1}^6 \left( \frac{u_k - v_k}{\sigma_k} \right)^2}$$
Similarity score $S(\mathbf{u}, \mathbf{v}) \in (0, 1]$:
$$S(\mathbf{u}, \mathbf{v}) = \frac{1}{1 + d(\mathbf{u}, \mathbf{v})}$$
Retrieved cases are ranked in descending order of $S(\mathbf{u}, \mathbf{v})$, presenting historical survival times and dead/censored outcomes for matched profiles.

