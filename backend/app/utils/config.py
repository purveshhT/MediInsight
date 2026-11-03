"""
Dataset configuration — paths and metadata
"""

import os

# Base paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_RAW_DIR = r"c:\dav_7"
DATA_PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")
DATA_REPORTS_DIR = os.path.join(BASE_DIR, "data", "reports")
UPLOADS_DIR = os.path.join(BASE_DIR, "data", "uploads")
DATABASE_PATH = os.path.join(BASE_DIR, "data", "mediinsight.db")
ML_MODELS_DIR = os.path.join(BASE_DIR, "ml", "saved_models")
ML_EVAL_DIR = os.path.join(BASE_DIR, "ml", "evaluation")

os.makedirs(DATA_PROCESSED_DIR, exist_ok=True)
os.makedirs(DATA_REPORTS_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(ML_MODELS_DIR, exist_ok=True)
os.makedirs(ML_EVAL_DIR, exist_ok=True)

# Dataset paths
NODULE_MNIST_PATH = r"c:\dav_7\.medmnist\nodulemnist3d.npz"
NSCLC_RADIOMICS_PATH = r"c:\dav_7\NSCLC-Radiomics-Lung1.clinical-version3-Oct-2019.csv"
NSCLC_RADIOGENOMICS_PATH = r"c:\dav_7\NSCLCR01Radiogenomic_DATA_LABELS_2018-05-22_1500-shifted.csv"
TCIA_DIAGNOSIS_PATH = r"c:\dav_7\tcia-diagnosis-data-2012-04-20.xls"
IQ_OTHNCCD_DIR = r"c:\dav_7\archive"
IQ_OTHNCCD_MANIFEST_PATH = os.path.join(DATA_PROCESSED_DIR, "iq_othnccd_manifest.csv")
CHEST_CT_SUBTYPES_DIR = r"c:\dav_7\archive (1)"
CHEST_CT_SUBTYPES_MANIFEST_PATH = os.path.join(DATA_PROCESSED_DIR, "chest_ct_subtypes_manifest.csv")

# Dataset registry
DATASET_REGISTRY = {
    "nodulemnist3d": {
        "id": "nodulemnist3d",
        "name": "NoduleMNIST3D",
        "path": NODULE_MNIST_PATH,
        "format": "npz",
        "description": "3D CT lung nodule volumes for binary classification (benign vs malignant). Low-resolution 28x28x28 research dataset. NOT paired with NSCLC clinical records.",
        "source": "MedMNIST v2",
        "total_samples": 1633,
        "train_samples": 1158,
        "val_samples": 165,
        "test_samples": 310,
        "image_shape": [28, 28, 28],
        "classes": {0: "Benign", 1: "Malignant"},
        "task": "binary_classification",
        "limitations": ["Low resolution (28x28x28)", "Not diagnostic quality", "Not paired with NSCLC clinical data"]
    },
    "nsclc_radiomics": {
        "id": "nsclc_radiomics",
        "name": "NSCLC-Radiomics (Lung1)",
        "path": NSCLC_RADIOMICS_PATH,
        "format": "csv",
        "description": "Clinical data for 422 NSCLC patients including demographics, TNM staging, histology, and survival outcomes.",
        "source": "TCIA NSCLC-Radiomics",
        "total_records": 422,
        "columns": ["PatientID", "age", "clinical.T.Stage", "Clinical.N.Stage", "Clinical.M.Stage",
                    "Overall.Stage", "Histology", "gender", "Survival.time", "deadstatus.event"],
        "task": "clinical_analytics",
        "limitations": ["No treatment records", "No molecular data", "Observational data only"]
    },
    "nsclc_radiogenomics": {
        "id": "nsclc_radiogenomics",
        "name": "NSCLC Radiogenomics",
        "path": NSCLC_RADIOGENOMICS_PATH,
        "format": "csv",
        "description": "Clinical, molecular, and treatment data for 211 NSCLC patients including EGFR/KRAS/ALK status, chemotherapy, radiation, and recurrence.",
        "source": "TCIA NSCLC Radiogenomics",
        "total_records": 211,
        "task": "treatment_analytics",
        "limitations": ["Small sample (211 patients)", "Missing staging data for many patients", "Observational - not RCT data"]
    },
    "tcia_diagnosis": {
        "id": "tcia_diagnosis",
        "name": "TCIA Diagnosis Data",
        "path": TCIA_DIAGNOSIS_PATH,
        "format": "xls",
        "description": "Nodule diagnosis metadata from LIDC-IDRI study. Independent from NSCLC-Radiomics and Radiogenomics cohorts.",
        "source": "TCIA LIDC-IDRI",
        "task": "diagnosis_analytics",
        "limitations": ["Different patient cohort (LIDC-IDRI IDs)", "Not linkable to NSCLC datasets without patient matching"]
    },
    "iq_othnccd": {
        "id": "iq_othnccd",
        "name": "IQ-OTH/NCCD Lung Cancer Dataset",
        "path": IQ_OTHNCCD_MANIFEST_PATH,
        "dir_path": IQ_OTHNCCD_DIR,
        "format": "jpg / png",
        "description": "Full-resolution (512x512) Siemens SOMATOM chest CT scan slices from 110 clinical cases across Normal (416 slices), Benign (120 slices), and Malignant (561 slices) classes, plus 197 test cases.",
        "source": "Iraq-Oncology Teaching Hospital / National Center for Cancer Diseases (IQ-OTH/NCCD)",
        "total_records": 1294,
        "task": "image_classification",
        "limitations": ["2D slice-level representation", "Independent regional Iraqi cohort", "No genomic or treatment follow-up records"]
    },
    "chest_ct_subtypes": {
        "id": "chest_ct_subtypes",
        "name": "Chest CT-Scan Cancer Subtypes",
        "path": CHEST_CT_SUBTYPES_MANIFEST_PATH,
        "dir_path": CHEST_CT_SUBTYPES_DIR,
        "format": "png",
        "description": "Multiclass chest CT scan cross-sections annotated with histological subtypes (Adenocarcinoma, Squamous Cell, Large Cell) and TNM staging markers across 1,000 images.",
        "source": "Chest CT-Scan Cancer Subtypes Benchmark",
        "total_records": 1000,
        "task": "histology_staging_analytics",
        "limitations": ["Pre-cropped axial slices", "Independent cohort", "Observational image annotations"]
    }
}

