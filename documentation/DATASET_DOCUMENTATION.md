# MediInsight AI: Dataset Documentation & Governance Protocol

## 1. Dataset Portfolio Overview

MediInsight AI operates on six distinct, public open-access biomedical datasets. Each dataset captures a unique facet of thoracic oncology, from low-resolution 3D CT imaging to clinical staging, treatment administration, diagnostic pathology metadata, whole-slice CT radiology scans, and multi-class cancer subtype benchmarks.

---

## 2. Dataset Specifics

### 2.1 Dataset 1: NoduleMNIST3D
* **Origin:** MedMNIST v2 Benchmark (derived from LIDC-IDRI).
* **Storage Path:** `c:\dav_7\.medmnist\nodulemnist3d.npz` (29,299,364 bytes).
* **File Format:** NumPy Compressed (`.npz`).
* **Volume Matrix Dimensions:** $28 \times 28 \times 28$ voxels, 1 grayscale channel (uint8).
* **Sample Count:**
  * Training Partition: 1,158 volumes (863 Benign, 295 Malignant).
  * Validation Partition: 165 volumes (123 Benign, 42 Malignant).
  * Test Partition: 310 volumes (246 Benign, 64 Malignant).
  * Total Cohort: 1,633 volumes.
* **Class Ratio:** Inherent $\approx 3:1$ class imbalance (74.5% Benign vs 25.5% Malignant).
* **Use Cases:** 3D CT slice visualization, voxel density profiling, feature extraction, PCA projection, binary malignancy classification.

### 2.2 Dataset 2: NSCLC-Radiomics (Lung1)
* **Origin:** The Cancer Imaging Archive (TCIA) - Lung1 Cohort.
* **Storage Path:** `c:\dav_7\NSCLC-Radiomics-Lung1.clinical-version3-Oct-2019.csv` (23,335 bytes).
* **Sample Size:** 422 Non-Small Cell Lung Cancer patients.
* **Variables (10 columns):**
  * `PatientID`: De-identified patient code (`LUNG1-001` through `LUNG1-422`).
  * `age`: Age in years (continuous, mean 67.8 yrs, range 34.0 - 92.4 yrs).
  * `clinical.T.Stage`: Tumor classification (T1, T2, T3, T4).
  * `Clinical.N.Stage`: Nodal involvement (N0, N1, N2, N3).
  * `Clinical.M.Stage`: Distant metastasis (M0, M1).
  * `Overall.Stage`: Summary stage (I, II, IIIa, IIIb).
  * `Histology`: Pathological classification (squamous cell carcinoma, large cell, adenocarcinoma, nos).
  * `gender`: Patient gender (`male`: 290, `female`: 132).
  * `Survival.time`: Overall survival duration in days.
  * `deadstatus.event`: Binary survival status (`1`: Deceased, `0`: Censored/Alive).
* **Use Cases:** Demographic distributions, TNM staging cross-tabulation, Pearson correlation matrices, Kaplan-Meier survival curves, clinical nearest-neighbor retrieval.

### 2.3 Dataset 3: NSCLC Radiogenomics
* **Origin:** The Cancer Imaging Archive (TCIA) - Stanford Radiogenomics Cohort.
* **Storage Path:** `c:\dav_7\NSCLCR01Radiogenomic_DATA_LABELS_2018-05-22_1500-shifted.csv` (66,643 bytes).
* **Sample Size:** 211 NSCLC patients.
* **Variables (40 columns):** Demographics, smoking history, histology, pathological TNM classifications, EGFR mutation status, KRAS mutation status, ALK translocation, Chemotherapy, Radiation, Recurrence, Time to Death.
* **Therapeutic Modalities Recorded:**
  * Chemotherapy: `Yes`: 49, `No`: 161, `Not Collected`: 1.
  * Radiation: `Yes`: 16, `No`: 194, `Not Collected`: 1.
  * Recurrence: `yes`: 54, `no`: 156, `Not collected`: 1.
* **Use Cases:** Systemic treatment frequency, recurrence surveillance, targetable molecular biomarker profiling.

### 2.4 Dataset 4: TCIA Diagnosis Metadata
* **Origin:** TCIA LIDC-IDRI Diagnostic Registry.
* **Storage Path:** `c:\dav_7\tcia-diagnosis-data-2012-04-20.xls` (46,080 bytes).
* **Sample Size:** 157 diagnostic records across 14 metadata attributes.
* **Use Cases:** Diagnostic metadata verification, LIDC-IDRI case audit.

### 2.5 Dataset 5: IQ-OTH/NCCD Lung Cancer Dataset
* **Origin:** Iraq Oncology Teaching Hospital / National Center for Cancer Diseases (IQ-OTH/NCCD).
* **Storage Path:** `c:\dav_7\archive` (manifest at `backend/data/processed/iq_othnccd_manifest.csv`).
* **Sample Size:** 1,294 axial CT slices from 110 patients scanned on a Siemens SOMATOM Definition AS.
* **Image Dimensions:** $512 \times 512$ pixels (DICOM converted to PNG/JPG).
* **Partitions & Classes:**
  * Normal Cases: 55 cases (416 slices).
  * Benign Cases: 15 cases (120 slices).
  * Malignant Cases: 40 cases (561 slices).
  * Unlabeled Validation / Test: 197 slices.
* **Use Cases:** Full-field axial CT visualization, non-nodular parenchyma comparison, radiological pattern analysis.

### 2.6 Dataset 6: Chest CT-Scan Cancer Subtypes Benchmark
* **Origin:** Multi-center CT scan benchmark for adenocarcinoma, squamous cell carcinoma, and large cell carcinoma.
* **Storage Path:** `c:\dav_7\archive (1)` (manifest at `backend/data/processed/chest_ct_subtypes_manifest.csv`).
* **Sample Size:** 1,000 CT images partitioned into Train (613), Valid (72), and Test (315).
* **Classes & Staging:**
  * Adenocarcinoma: 338 images (T2N0M0, Stage Ib).
  * Squamous Cell Carcinoma: 260 images (T1N2M0, Stage IIIa).
  * Large Cell Carcinoma: 187 images (T2N2M0, Stage IIIa).
  * Normal: 215 images (No tumor pathology).
* **Use Cases:** Multi-class histological subtype classification benchmark, subtype staging differentiation, cross-center imaging evaluation.

---

## 3. Data Governance Protocols

1. **Strict Cohort Isolation:** Under no circumstances are independent datasets merged on artificial keys. Patients from `NSCLC-Radiomics` are completely distinct from `NSCLC Radiogenomics`, `NoduleMNIST3D`, `IQ-OTH/NCCD`, and `Chest CT Subtypes`.
2. **Zero Synthetic Patient Fabrication:** All clinical analytics and visualizations reflect real, historical records.
3. **Observational Integrity:** Survival distributions in retrospective cohorts reflect clinical presentation and non-randomized treatment assignment; causal efficacy claims are strictly prohibited.
4. **Laboratory Data Governance:** Incomplete or unrecorded laboratory tests are explicitly marked as "Not Tested". The system never fabricates normal values or draws automated clinical conclusions from missing data.

