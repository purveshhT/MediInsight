# MediInsight AI: Data Quality & Governance Audit Report

## 1. Audit Summary

An automated data profiling audit was performed on all four datasets prior to statistical modeling. The audit examined column-level missingness, duplicate rows, data type consistency, and class distributions.

| Dataset Name | Records | Columns | Duplicate Rows | Missing Value Percentage | Overall Completeness Score |
|---|---|---|---|---|---|
| **NSCLC-Radiomics (Lung1)** | 422 | 10 | 0 (0.0%) | 0.99% | **99.01%** |
| **NSCLC Radiogenomics** | 211 | 40 | 0 (0.0%) | 24.32% | **75.68%** |
| **NoduleMNIST3D** | 1,633 | 28×28×28 matrix | 0 (0.0%) | 0.00% | **100.0%** |
| **TCIA Diagnosis Metadata** | 157 | 14 | 0 (0.0%) | 4.81% | **95.19%** |

---

## 2. NSCLC-Radiomics (Lung1) Quality Profile

* **Total Records:** 422
* **Duplicate Rows:** 0 (Confirmed by unique `PatientID` constraints).
* **Missing Value Breakdown:**
  * `Overall.Stage`: 1 missing entry (0.24%). Handled via modal imputation.
  * `Histology`: 42 entries coded as `NA` or unspecified (9.95%). Preserved as distinct category `nos` (Not Otherwise Specified).
  * `clinical.T.Stage`, `Clinical.N.Stage`, `Clinical.M.Stage`: Complete (100% recorded).
  * `age`: Complete (mean 67.8 yrs, std dev 10.0 yrs).
  * `Survival.time` & `deadstatus.event`: Complete (100% recorded, 312 events, 110 censored).

---

## 3. NSCLC Radiogenomics Quality Profile

* **Total Records:** 211
* **Duplicate Rows:** 0 (Unique `Case ID` entries).
* **Missing Value / Non-Collected Attributes:**
  * Pathological staging (`Pathological T/N/M stage`) was missing for 68 patients (32.2%) who did not undergo surgical resection or where staging was uncollected.
  * Smoking pack years was missing or unrecorded for 42 patients (19.9%).
  * Weight (lbs) was uncollected for 114 patients (54.0%).
  * Time to Death was recorded for deceased patients (n=63, median 482 days).
* **Governance Action:** Columns with >50% missingness are excluded from similarity distance vectors. Missing categorical values are preserved as explicit `Unknown` / `Not Collected` states rather than arbitrarily imputed.

---

## 4. NoduleMNIST3D Quality Profile

* **Volume Matrix Integrity:** Checked all 1,633 3D arrays for null, NaN, or non-finite elements. Zero NaN values detected.
* **Voxel Intensity Dynamic Range:** Minimum = 0, Maximum = 255 (uint8 range confirmed).
* **Class Imbalance:**
  * Train: 863 Benign (74.5%) vs 295 Malignant (25.5%). Ratio = 2.93 : 1.
  * Test: 246 Benign (79.4%) vs 64 Malignant (20.6%). Ratio = 3.84 : 1.
* **Governance Mitigation:** Machine learning models incorporate inverse class weighting ($w_0 = 1.0, w_1 = 2.93$) to counteract majority class bias during classification training.

