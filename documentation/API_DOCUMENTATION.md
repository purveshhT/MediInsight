# MediInsight AI: REST API Documentation

## 1. Overview & Base URL

* **Base URL:** `http://localhost:8000/api`
* **Interactive OpenAPI Swagger Docs:** `http://localhost:8000/api/docs`
* **ReDoc Specification:** `http://localhost:8000/api/redoc`

---

## 2. Endpoints Catalog

### 2.1 System Health
* `GET /api/health`
  * Response: `{"status": "ok", "service": "MediInsight AI API", "version": "1.0.0"}`

### 2.2 Dataset Management & Quality
* `GET /api/datasets`: List all registered datasets and metadata.
* `GET /api/datasets/stats`: Record counts and basic sample statistics.
* `GET /api/datasets/quality`: Comprehensive quality, missingness, and column profiling report.
* `GET /api/datasets/{dataset_id}/summary`: Metadata for a specific dataset (`nodulemnist3d`, `nsclc_radiomics`, etc.).
* `GET /api/datasets/{dataset_id}/quality`: Quality report for a specific dataset.
* `GET /api/datasets/{dataset_id}/explore?page=1&page_size=50`: Paginated row inspection and filtering.

### 2.3 Analytics Engine
* `GET /api/analytics/overview`: Healthcare population KPIs, stage, age, gender, histology distributions.
* `GET /api/analytics/clinical`: TNM distributions, age-by-stage box statistics, Pearson correlation matrix.
* `GET /api/analytics/treatment`: Systemic chemotherapy and radiation administration, targetable biomarkers, recurrence rates.
* `GET /api/analytics/imaging`: NoduleMNIST3D statistics, class distribution, voxel intensity histogram.
* `GET /api/analytics/survival`: Kaplan-Meier non-parametric survival curves stratified by cancer stage.
* `GET /api/analytics/survival/gender`: Kaplan-Meier curves stratified by gender.
* `GET /api/analytics/imaging/pca`: 2D/3D PCA projection coordinates of test set imaging features.
* `GET /api/analytics/models/evaluation`: Training metadata, metrics, and held-out test benchmarks.

### 2.4 Medical Imaging & Classification
* `GET /api/imaging/overview`: Volumetric CT dimensions and global intensity ranges.
* `GET /api/imaging/samples?split=test&limit=50`: List imaging sample summaries.
* `GET /api/imaging/samples/{sample_id}?split=test`: Retrieve 3D volume slices (`slice_25pct`, `slice_50pct`, `slice_75pct`) and metadata.
* `POST /api/imaging/predict?sample_id={id}&split=test`: Run Random Forest inference on the specified 3D volume.
* `GET /api/imaging/similar?sample_id={id}&split=test&n_neighbors=5`: Find similar 3D imaging cases.

### 2.5 Clinical Assessment & Decision Support
* `POST /api/assessment`: Create and register a local patient evaluation session.
* `GET /api/assessment`: Audit log of created demonstration assessments.
* `GET /api/assessment/{assessment_id}`: Retrieve full session record.
* `POST /api/recommendations`: Compute guideline-aligned candidate treatment rankings.
* `GET /api/reports/similar-cases`: Retrieve k-NN matching cases from NSCLC-Radiomics.
* `POST /api/reports/models/train`: Trigger on-demand retraining of the Nodule Classifier.

