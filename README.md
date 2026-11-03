# MediInsight AI: Multimodal Healthcare Analytics & Clinical Decision Support Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.162.0-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.3.1-61DAFB.svg?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0.2-3178C6.svg?logo=typescript)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com)
[![Scikit-Learn](https://img.shields.io/badge/scikit--learn-1.9.1-F7931E.svg?logo=scikit-learn)](https://scikit-learn.org)
[![Academic Project](https://img.shields.io/badge/Type-BTech%20IT%20Capstone-blue.svg)](#)

---

## 1. Executive Summary & Project Purpose

**MediInsight AI** is a multimodal healthcare analytics and clinical decision-support ecosystem. Built specifically for an academic BTech Information Technology curriculum, the platform emphasizes **Data Analytics, Visual Analytics, and Healthcare Governance**, underpinned by:
* Machine Learning & Volumetric CT Feature Analysis.
* Explainable Clinical Decision Support & Guideline Ranking.
* Recommender Systems (k-Nearest Neighbors case retrieval).
* Kaplan-Meier Survival Analysis.

The platform provides two distinctly decoupled workspaces:
1. **Doctor Workspace:** A distraction-free, professional clinical decision-support interface tailored for practitioners. Complex ML terminology is abstracted into structured risk matrices, guideline-aligned treatment pathway rankings, similar patient matching, and downloadable clinical summary reports.
2. **Analytics & Research Workspace:** An in-depth analytical environment for data scientists, bioinformaticians, and faculty evaluators featuring 10 specialized dashboards, interactive visualizations, correlation matrices, dimensionality reduction projections (PCA), data quality audits, and raw dataset exploration.

---

## 2. Ingested Datasets & Provenance

| Dataset Identifier | Domain | Format | Samples / Records | Features | Provenance / Role |
|---|---|---|---|---|---|
| **NoduleMNIST3D** | Medical Imaging | NPZ (NumPy Compressed) | **1,633 3D Volumes** (1,158 Train, 165 Val, 310 Test) | 28 × 28 × 28 Voxels (uint8) | MedMNIST v2 Benchmark (LIDC-IDRI). Binary nodule classification (Benign vs Malignant). |
| **NSCLC-Radiomics (Lung1)** | Clinical Oncology | CSV | **422 Patients** | 10 Variables (Age, Gender, TNM Staging, Histology, Overall Stage, Survival Time, Dead Status) | TCIA Open-Access Cohort. Demographics, clinical staging, correlation analysis, and Kaplan-Meier curves. |
| **NSCLC Radiogenomics** | Clinical + Radiogenomics | CSV | **211 Patients** | 40 Variables (EGFR, KRAS, ALK Status, Chemotherapy, Radiation, Recurrence, Time to Death) | TCIA Radiogenomics Cohort. Systemic therapy analysis, targetable mutations, and recurrence surveillance. |
| **TCIA Diagnosis Metadata** | Diagnostic Pathology | XLS | **157 Records** | 14 Diagnostic & Histological Fields | LIDC-IDRI Diagnostic Metadata. Cross-validation of diagnostic criteria. |
| **IQ-OTH/NCCD Lung Cancer** | Thoracic CT Imaging | Axial CT Slices (512×512) | **1,294 Slices** (110 Patients: 55 Normal, 15 Benign, 40 Malignant) | Full-field axial DICOM/PNG slices | Iraq Oncology Teaching Hospital / NCCD. High-resolution parenchymal CT slice visualization and classification. |
| **Chest CT Cancer Subtypes** | Histopathological CT | Image Slices | **1,000 Scans** (Train: 613, Val: 72, Test: 315) | Adeno (338), Squamous (260), Large Cell (187), Normal (215) | Benchmark for multi-class thoracic malignancy differentiation across defined clinical stages (T1N2M0, T2N0M0, T2N2M0). |

> **Data Governance Policy:** All six datasets maintain strict cohort separation. Because patient IDs originate from independent clinical trials and registries, records are **never artificially joined or fused**.

---

## 3. System Architecture & Workspaces

```
MediInsight-AI/
├── frontend/                     # React 19 + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── layouts/              # Doctor & Analytics Layouts + Sidebars
│   │   ├── pages/doctor/         # 7 Clinical Workspace Views
│   │   ├── pages/analytics/      # 10 Research Dashboards
│   │   ├── services/             # Axios API Client Layer
│   │   └── utils/                # Color palettes, formatting helpers
├── backend/                      # FastAPI Python Application
│   ├── app/
│   │   ├── api/                  # REST API Endpoints (Health, Datasets, Analytics, Imaging, etc.)
│   │   ├── analytics/            # Analytics Engines (Stats, Kaplan-Meier, PCA, Histograms)
│   │   ├── imaging/              # 3D CT Voxel Extractors & Slice Navigators
│   │   ├── models/               # Nodule Random Forest Classifier (AUC: 0.894)
│   │   ├── services/             # KNN Case Retrieval & Quality Profilers
│   │   └── utils/                # Configuration & Path Managers
│   └── tests/                    # 14 Direct Endpoint & Integration Test Suites
├── ml/
│   ├── saved_models/             # Serialized Model Weights & Standard Scalers
│   └── evaluation/               # JSON Metrics (Accuracy, AUC, Confusion Matrix, Feature Importance)
├── documentation/                # 9 Comprehensive Academic Reports
└── run_project.bat               # Windows One-Click Batch Startup Launcher
```

---

## 4. Workspaces & Screen Navigation

### A. Doctor Workspace
1. **Doctor Dashboard:** At-a-glance patient population metrics, 6 active research datasets (3,927 imaging scans), system status, and immediate clinical workflows.
2. **New Patient Assessment:** Validated 6-step clinical intake form collecting demographics (including Occupation & Address), TNM staging, molecular biomarkers (EGFR/KRAS/ALK), dedicated Blood Workup / Laboratory Investigations (CBC, LFT, RFT, Electrolytes with reference ranges and PDF report upload), and research 3D CT volume selection.
3. **Clinical Analysis:** Patient histopathology profile, TNM matrix breakdown, biomarker panel status, comprehensive Laboratory Investigations & Blood Workup panel with clinical reference ranges, and interactive 3D CT slice viewer.
4. **Treatment Recommendations:** Guideline-informed candidate pathways ranked by clinical alignment scores, displaying supporting factors, limiting factors, and missing information alerts.
5. **Similar Patient Cases:** k-Nearest Neighbors clinical case matching across 422 historical patients from NSCLC-Radiomics with similarity percentages and observed outcomes.
6. **Patient History:** Audit trail of local demonstration sessions created during the runtime session, displaying occupation, address, and laboratory completeness status badges.
7. **Reports:** Printable clinical summary containing patient demographics, complete laboratory workup findings, imaging analysis, treatment candidates, and regulatory disclaimers.

### B. Analytics & Research Workspace
1. **Healthcare Overview:** Population KPIs, cancer stage donut chart, gender breakdown, age distribution histogram, and dataset size comparisons.
2. **Patient Analytics:** Demographic stratification, histology by gender, and smoking status distributions.
3. **Clinical Analytics:** TNM staging frequencies, age-by-stage box statistics, Pearson correlation matrix, and Kaplan-Meier survival curves.
4. **Medical Imaging Analytics:** NoduleMNIST3D volume explorer, axial slice viewer (25%, 50%, 75%), voxel intensity histograms, and 2D PCA feature projection.
5. **Treatment Analytics:** Chemotherapy and radiation frequency charts, recurrence distributions, and targetable biomarker summaries.
6. **AI Recommendation Analytics:** Test set performance benchmarks, confusion matrix diagnostics (TN, FP, FN, TP), and radiomic feature importances.
7. **Similarity Analytics:** Feature distance ranking, KNN score distributions, and multi-attribute neighbor comparisons.
8. **Model Evaluation:** Training history, held-out classification reports, and one-click CPU model retraining.
9. **Data Quality Dashboard:** Missing value percentages, schema dictionaries, and zero-duplicate integrity confirmations.
10. **Dataset Explorer:** Paginated record browser with column search and multi-cohort switching.

---

## 5. Quick Start Instructions (Windows)

### Option 1: One-Click Startup (Recommended)
Simply double-click the included batch launcher:
```cmd
c:\dav_7\run_project.bat
```
This batch script will:
1. Start the FastAPI backend on `http://localhost:8000`
2. Start the React/Vite frontend on `http://localhost:5173`
3. Automatically launch your default web browser to the application

### Option 2: Manual Terminal Execution

#### 1. Start FastAPI Backend:
```powershell
cd c:\dav_7\MediInsight-AI\backend
C:\Users\Impur\AppData\Local\Programs\Python\Python313\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Start React Frontend:
```powershell
cd c:\dav_7\MediInsight-AI\frontend
C:\nvm4w\nodejs\npm.cmd run dev -- --host 0.0.0.0
```

#### 3. Open in Browser:
* **Unified Application Portal:** `http://localhost:5173/`
  * **Doctor Workspace:** `http://localhost:5173/doctor`
  * **Analytics & Research Workspace:** `http://localhost:5173/analytics`
* **Interactive API Documentation:** `http://localhost:8000/api/docs`

---

## 6. Running Verification Tests

Run the automated integration test suite:
```powershell
cd c:\dav_7\MediInsight-AI\backend
C:\Users\Impur\AppData\Local\Programs\Python\Python313\python.exe tests/test_direct.py
```
**Expected Result:**
```
=======================================================
ALL 14 DIRECT ENDPOINT INTEGRATION TESTS PASSED (100%)
=======================================================
```

---

## 7. Regulatory & Clinical Safety Disclaimer

> **IMPORTANT:** MediInsight AI is an academic educational and research prototype developed solely for BTech IT capstone evaluation. It has **NOT** been certified by regulatory bodies (e.g., FDA, EMA, CDSCO) as a medical device or Software as a Medical Device (SaMD).
>
> 1. It does NOT independently diagnose illness or prescribe pharmaceutical regimens.
> 2. Treatment recommendation ranking scores represent heuristic guideline weights, NOT individualized survival probabilities.
> 3. Case similarity reflects geometric proximity in standardized clinical feature space, NOT biological equivalence.
> 4. All public datasets are observational and anonymized; they must not be associated with real hospital patients.

