"""
Persistent SQLite database management for patient assessments and uploaded medical images.
Provides ACID persistence, image association, and real-time analytical aggregation.
"""

import sqlite3
import os
import json
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from app.utils.config import DATABASE_PATH, UPLOADS_DIR


def get_connection() -> sqlite3.Connection:
    """Return an active connection to the SQLite database."""
    conn = sqlite3.connect(DATABASE_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create schema tables if they do not exist, and seed baseline demo records."""
    conn = get_connection()
    cursor = conn.cursor()

    # Assessments table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS assessments (
        id TEXT PRIMARY KEY,
        patient_name TEXT NOT NULL DEFAULT 'Anonymous Patient',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        age REAL NOT NULL,
        gender TEXT NOT NULL,
        smoking_history TEXT,
        smoking_pack_years REAL,
        weight REAL,
        occupation TEXT DEFAULT 'Unspecified',
        address TEXT DEFAULT 'Not provided',
        histology TEXT NOT NULL,
        cancer_type TEXT DEFAULT 'Non-Small Cell Lung Cancer',
        t_stage TEXT DEFAULT '1',
        n_stage TEXT DEFAULT '0',
        m_stage TEXT DEFAULT '0',
        overall_stage TEXT NOT NULL,
        clinical_stage TEXT,
        pathological_stage TEXT,
        performance_status TEXT,
        egfr_status TEXT DEFAULT 'Unknown',
        kras_status TEXT DEFAULT 'Unknown',
        alk_status TEXT DEFAULT 'Unknown',
        other_biomarkers TEXT,
        blood_workup TEXT,
        medical_history TEXT,
        comorbidities TEXT,
        chemotherapy TEXT DEFAULT 'No',
        radiation TEXT DEFAULT 'No',
        notes TEXT,
        assessment_status TEXT DEFAULT 'completed',
        data_source TEXT DEFAULT 'Newly Created Assessments',
        research_sample_id INTEGER,
        research_split TEXT DEFAULT 'test'
    )
    """)

    # Medical Images table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS medical_images (
        id TEXT PRIMARY KEY,
        assessment_id TEXT NOT NULL,
        original_filename TEXT NOT NULL,
        stored_filename TEXT NOT NULL,
        file_format TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        upload_timestamp TEXT NOT NULL,
        image_dimensions TEXT,
        image_type TEXT DEFAULT '2D CT / X-Ray',
        processing_status TEXT DEFAULT 'stored',
        file_path TEXT NOT NULL,
        FOREIGN KEY (assessment_id) REFERENCES assessments (id) ON DELETE CASCADE
    )
    """)

    # Dynamic schema migration for existing SQLite databases
    cursor.execute("PRAGMA table_info(assessments)")
    existing_cols = {row["name"] for row in cursor.fetchall()}

    if "patient_name" not in existing_cols:
        cursor.execute("ALTER TABLE assessments ADD COLUMN patient_name TEXT NOT NULL DEFAULT 'Anonymous Patient'")
    if "occupation" not in existing_cols:
        cursor.execute("ALTER TABLE assessments ADD COLUMN occupation TEXT DEFAULT 'Unspecified'")
    if "address" not in existing_cols:
        cursor.execute("ALTER TABLE assessments ADD COLUMN address TEXT DEFAULT 'Not provided'")
    if "blood_workup" not in existing_cols:
        cursor.execute("ALTER TABLE assessments ADD COLUMN blood_workup TEXT")

    conn.commit()

    # Seed baseline demonstration assessments if empty
    cursor.execute("SELECT COUNT(*) as count FROM assessments")
    count = cursor.fetchone()["count"]
    if count == 0:
        _seed_initial_demonstration_records(cursor)
        conn.commit()
    else:
        # Backfill seed demonstration records if patient_name, occupation or blood_workup is missing
        _backfill_demonstration_records(cursor)
        conn.commit()

    conn.close()


def _backfill_demonstration_records(cursor: sqlite3.Cursor):
    """Backfill patient name, occupation, address, and laboratory investigations for existing demo records."""
    demo_names = {
        "DEMO-0001": "Arthur Pendelton",
        "DEMO-0002": "Eleanor Vance",
        "DEMO-0003": "Marcus Holloway",
    }
    for demo_id, name in demo_names.items():
        cursor.execute(
            "UPDATE assessments SET patient_name = ? WHERE id = ? AND (patient_name IS NULL OR patient_name = 'Anonymous Patient' OR patient_name = '')",
            (name, demo_id)
        )
    demo_updates = {
        "DEMO-0001": {
            "occupation": "Retired University Professor",
            "address": "452 Elm Street, Suite 4B, Cambridge, MA 02138",
            "blood_workup": json.dumps({
                "cbc": {
                    "hemoglobin": {"value": 14.1, "unit": "g/dL", "ref_range": "12.0 - 17.5", "status": "Normal"},
                    "wbc_count": {"value": 7.2, "unit": "10^3/µL", "ref_range": "4.5 - 11.0", "status": "Normal"},
                    "platelets": {"value": 245, "unit": "10^3/µL", "ref_range": "150 - 450", "status": "Normal"},
                    "rbc_count": {"value": 4.8, "unit": "10^6/µL", "ref_range": "4.0 - 5.9", "status": "Normal"},
                    "neutrophils": {"value": 62.0, "unit": "%", "ref_range": "40.0 - 75.0", "status": "Normal"},
                    "lymphocytes": {"value": 28.0, "unit": "%", "ref_range": "20.0 - 45.0", "status": "Normal"}
                },
                "lft": {
                    "total_bilirubin": {"value": 0.8, "unit": "mg/dL", "ref_range": "0.2 - 1.2", "status": "Normal"},
                    "direct_bilirubin": {"value": 0.2, "unit": "mg/dL", "ref_range": "0.0 - 0.3", "status": "Normal"},
                    "ast_sgot": {"value": 24, "unit": "U/L", "ref_range": "10 - 40", "status": "Normal"},
                    "alt_sgpt": {"value": 28, "unit": "U/L", "ref_range": "7 - 56", "status": "Normal"},
                    "alp": {"value": 85, "unit": "U/L", "ref_range": "44 - 147", "status": "Normal"},
                    "total_protein": {"value": 7.1, "unit": "g/dL", "ref_range": "6.0 - 8.3", "status": "Normal"},
                    "albumin": {"value": 4.2, "unit": "g/dL", "ref_range": "3.5 - 5.0", "status": "Normal"}
                },
                "rft": {
                    "bun": {"value": 14.0, "unit": "mg/dL", "ref_range": "7.0 - 20.0", "status": "Normal"},
                    "serum_creatinine": {"value": 0.9, "unit": "mg/dL", "ref_range": "0.6 - 1.3", "status": "Normal"},
                    "egfr": {"value": 91.0, "unit": "mL/min/1.73m²", "ref_range": ">= 60.0", "status": "Normal"},
                    "uric_acid": {"value": 5.4, "unit": "mg/dL", "ref_range": "3.5 - 7.2", "status": "Normal"}
                },
                "electrolytes": {
                    "sodium": {"value": 140.0, "unit": "mEq/L", "ref_range": "135 - 145", "status": "Normal"},
                    "potassium": {"value": 4.2, "unit": "mEq/L", "ref_range": "3.5 - 5.0", "status": "Normal"},
                    "chloride": {"value": 101.0, "unit": "mEq/L", "ref_range": "96 - 106", "status": "Normal"},
                    "bicarbonate": {"value": 25.0, "unit": "mEq/L", "ref_range": "22 - 29", "status": "Normal"},
                    "calcium": {"value": 9.4, "unit": "mg/dL", "ref_range": "8.5 - 10.5", "status": "Normal"}
                },
                "report_notes": "Pre-operative complete blood count and metabolic panel within physiological limits."
            })
        },
        "DEMO-0002": {
            "occupation": "Senior Accountant",
            "address": "1208 Pine Crest Way, Raleigh, NC 27606",
            "blood_workup": json.dumps({
                "cbc": {
                    "hemoglobin": {"value": 11.8, "unit": "g/dL", "ref_range": "12.0 - 16.0", "status": "Low"},
                    "wbc_count": {"value": 8.1, "unit": "10^3/µL", "ref_range": "4.5 - 11.0", "status": "Normal"},
                    "platelets": {"value": 310, "unit": "10^3/µL", "ref_range": "150 - 450", "status": "Normal"},
                    "rbc_count": {"value": 3.9, "unit": "10^6/µL", "ref_range": "4.0 - 5.2", "status": "Low"},
                    "neutrophils": {"value": 68.0, "unit": "%", "ref_range": "40.0 - 75.0", "status": "Normal"},
                    "lymphocytes": {"value": 22.0, "unit": "%", "ref_range": "20.0 - 45.0", "status": "Normal"}
                },
                "lft": {
                    "total_bilirubin": {"value": 0.6, "unit": "mg/dL", "ref_range": "0.2 - 1.2", "status": "Normal"},
                    "direct_bilirubin": {"value": 0.1, "unit": "mg/dL", "ref_range": "0.0 - 0.3", "status": "Normal"},
                    "ast_sgot": {"value": 19, "unit": "U/L", "ref_range": "10 - 40", "status": "Normal"},
                    "alt_sgpt": {"value": 22, "unit": "U/L", "ref_range": "7 - 56", "status": "Normal"},
                    "alp": {"value": 92, "unit": "U/L", "ref_range": "44 - 147", "status": "Normal"},
                    "total_protein": {"value": 6.8, "unit": "g/dL", "ref_range": "6.0 - 8.3", "status": "Normal"},
                    "albumin": {"value": 3.8, "unit": "g/dL", "ref_range": "3.5 - 5.0", "status": "Normal"}
                },
                "rft": {
                    "bun": {"value": 18.0, "unit": "mg/dL", "ref_range": "7.0 - 20.0", "status": "Normal"},
                    "serum_creatinine": {"value": 1.1, "unit": "mg/dL", "ref_range": "0.5 - 1.1", "status": "Normal"},
                    "egfr": {"value": 68.0, "unit": "mL/min/1.73m²", "ref_range": ">= 60.0", "status": "Normal"},
                    "uric_acid": {"value": 6.1, "unit": "mg/dL", "ref_range": "2.7 - 6.1", "status": "Normal"}
                },
                "electrolytes": {
                    "sodium": {"value": 138.0, "unit": "mEq/L", "ref_range": "135 - 145", "status": "Normal"},
                    "potassium": {"value": 4.5, "unit": "mEq/L", "ref_range": "3.5 - 5.0", "status": "Normal"},
                    "chloride": {"value": 99.0, "unit": "mEq/L", "ref_range": "96 - 106", "status": "Normal"},
                    "bicarbonate": {"value": 23.0, "unit": "mEq/L", "ref_range": "22 - 29", "status": "Normal"},
                    "calcium": {"value": 9.1, "unit": "mg/dL", "ref_range": "8.5 - 10.5", "status": "Normal"}
                },
                "report_notes": "Mild normocytic anemia noted; renal clearance adequate for targeted systemic agent administration."
            })
        },
        "DEMO-0003": {
            "occupation": "Commercial Logistics Specialist",
            "address": "884 Marina Boulevard, Seattle, WA 98121",
            "blood_workup": json.dumps({
                "cbc": {
                    "hemoglobin": {"value": 15.3, "unit": "g/dL", "ref_range": "13.0 - 17.5", "status": "Normal"},
                    "wbc_count": {"value": 6.5, "unit": "10^3/µL", "ref_range": "4.5 - 11.0", "status": "Normal"},
                    "platelets": {"value": 220, "unit": "10^3/µL", "ref_range": "150 - 450", "status": "Normal"},
                    "rbc_count": {"value": 5.1, "unit": "10^6/µL", "ref_range": "4.3 - 5.9", "status": "Normal"},
                    "neutrophils": {"value": 58.0, "unit": "%", "ref_range": "40.0 - 75.0", "status": "Normal"},
                    "lymphocytes": {"value": 33.0, "unit": "%", "ref_range": "20.0 - 45.0", "status": "Normal"}
                },
                "lft": {
                    "total_bilirubin": {"value": 0.7, "unit": "mg/dL", "ref_range": "0.2 - 1.2", "status": "Normal"},
                    "direct_bilirubin": {"value": 0.1, "unit": "mg/dL", "ref_range": "0.0 - 0.3", "status": "Normal"},
                    "ast_sgot": {"value": 22, "unit": "U/L", "ref_range": "10 - 40", "status": "Normal"},
                    "alt_sgpt": {"value": 25, "unit": "U/L", "ref_range": "7 - 56", "status": "Normal"},
                    "alp": {"value": 76, "unit": "U/L", "ref_range": "44 - 147", "status": "Normal"},
                    "total_protein": {"value": 7.4, "unit": "g/dL", "ref_range": "6.0 - 8.3", "status": "Normal"},
                    "albumin": {"value": 4.5, "unit": "g/dL", "ref_range": "3.5 - 5.0", "status": "Normal"}
                },
                "rft": {
                    "bun": {"value": 13.0, "unit": "mg/dL", "ref_range": "7.0 - 20.0", "status": "Normal"},
                    "serum_creatinine": {"value": 0.8, "unit": "mg/dL", "ref_range": "0.6 - 1.3", "status": "Normal"},
                    "egfr": {"value": 98.0, "unit": "mL/min/1.73m²", "ref_range": ">= 60.0", "status": "Normal"},
                    "uric_acid": {"value": 4.9, "unit": "mg/dL", "ref_range": "3.5 - 7.2", "status": "Normal"}
                },
                "electrolytes": {
                    "sodium": {"value": 142.0, "unit": "mEq/L", "ref_range": "135 - 145", "status": "Normal"},
                    "potassium": {"value": 4.1, "unit": "mEq/L", "ref_range": "3.5 - 5.0", "status": "Normal"},
                    "chloride": {"value": 103.0, "unit": "mEq/L", "ref_range": "96 - 106", "status": "Normal"},
                    "bicarbonate": {"value": 26.0, "unit": "mEq/L", "ref_range": "22 - 29", "status": "Normal"},
                    "calcium": {"value": 9.6, "unit": "mg/dL", "ref_range": "8.5 - 10.5", "status": "Normal"}
                },
                "report_notes": "All hematologic, renal and hepatic profiles within baseline reference tolerance for surgical planning."
            })
        }
    }
    for demo_id, vals in demo_updates.items():
        cursor.execute("SELECT occupation, address, blood_workup FROM assessments WHERE id = ?", (demo_id,))
        row = cursor.fetchone()
        if row:
            if not row["occupation"] or row["occupation"] == "Unspecified":
                cursor.execute("UPDATE assessments SET occupation = ? WHERE id = ?", (vals["occupation"], demo_id))
            if not row["address"] or row["address"] == "Not provided":
                cursor.execute("UPDATE assessments SET address = ? WHERE id = ?", (vals["address"], demo_id))
            if not row["blood_workup"]:
                cursor.execute("UPDATE assessments SET blood_workup = ? WHERE id = ?", (vals["blood_workup"], demo_id))


def _seed_initial_demonstration_records(cursor: sqlite3.Cursor):
    """Seed three realistic demonstration assessments with different characteristics."""
    now = datetime.now().isoformat()
    seed_cases = [
        {
            "id": "DEMO-0001",
            "patient_name": "Arthur Pendelton",
            "created_at": now,
            "updated_at": now,
            "age": 68.0,
            "gender": "male",
            "smoking_history": "Former Smoker",
            "smoking_pack_years": 35.0,
            "weight": 165.0,
            "occupation": "Retired University Professor",
            "address": "452 Elm Street, Suite 4B, Cambridge, MA 02138",
            "histology": "adenocarcinoma",
            "cancer_type": "Non-Small Cell Lung Cancer",
            "t_stage": "2",
            "n_stage": "1",
            "m_stage": "0",
            "overall_stage": "II",
            "clinical_stage": "Stage IIB",
            "pathological_stage": "pT2aN1M0",
            "performance_status": "ECOG 0",
            "egfr_status": "Positive",
            "kras_status": "Negative",
            "alk_status": "Negative",
            "other_biomarkers": "PD-L1: 45%",
            "blood_workup": json.dumps({
                "cbc": {
                    "hemoglobin": {"value": 14.1, "unit": "g/dL", "ref_range": "12.0 - 17.5", "status": "Normal"},
                    "wbc_count": {"value": 7.2, "unit": "10^3/µL", "ref_range": "4.5 - 11.0", "status": "Normal"},
                    "platelets": {"value": 245, "unit": "10^3/µL", "ref_range": "150 - 450", "status": "Normal"},
                    "rbc_count": {"value": 4.8, "unit": "10^6/µL", "ref_range": "4.0 - 5.9", "status": "Normal"},
                    "neutrophils": {"value": 62.0, "unit": "%", "ref_range": "40.0 - 75.0", "status": "Normal"},
                    "lymphocytes": {"value": 28.0, "unit": "%", "ref_range": "20.0 - 45.0", "status": "Normal"}
                },
                "lft": {
                    "total_bilirubin": {"value": 0.8, "unit": "mg/dL", "ref_range": "0.2 - 1.2", "status": "Normal"},
                    "direct_bilirubin": {"value": 0.2, "unit": "mg/dL", "ref_range": "0.0 - 0.3", "status": "Normal"},
                    "ast_sgot": {"value": 24, "unit": "U/L", "ref_range": "10 - 40", "status": "Normal"},
                    "alt_sgpt": {"value": 28, "unit": "U/L", "ref_range": "7 - 56", "status": "Normal"},
                    "alp": {"value": 85, "unit": "U/L", "ref_range": "44 - 147", "status": "Normal"},
                    "total_protein": {"value": 7.1, "unit": "g/dL", "ref_range": "6.0 - 8.3", "status": "Normal"},
                    "albumin": {"value": 4.2, "unit": "g/dL", "ref_range": "3.5 - 5.0", "status": "Normal"}
                },
                "rft": {
                    "bun": {"value": 14.0, "unit": "mg/dL", "ref_range": "7.0 - 20.0", "status": "Normal"},
                    "serum_creatinine": {"value": 0.9, "unit": "mg/dL", "ref_range": "0.6 - 1.3", "status": "Normal"},
                    "egfr": {"value": 91.0, "unit": "mL/min/1.73m²", "ref_range": ">= 60.0", "status": "Normal"},
                    "uric_acid": {"value": 5.4, "unit": "mg/dL", "ref_range": "3.5 - 7.2", "status": "Normal"}
                },
                "electrolytes": {
                    "sodium": {"value": 140.0, "unit": "mEq/L", "ref_range": "135 - 145", "status": "Normal"},
                    "potassium": {"value": 4.2, "unit": "mEq/L", "ref_range": "3.5 - 5.0", "status": "Normal"},
                    "chloride": {"value": 101.0, "unit": "mEq/L", "ref_range": "96 - 106", "status": "Normal"},
                    "bicarbonate": {"value": 25.0, "unit": "mEq/L", "ref_range": "22 - 29", "status": "Normal"},
                    "calcium": {"value": 9.4, "unit": "mg/dL", "ref_range": "8.5 - 10.5", "status": "Normal"}
                },
                "report_notes": "Pre-operative complete blood count and metabolic panel within physiological limits."
            }),
            "medical_history": "Mild hypertension, coronary stent in 2021",
            "comorbidities": "Hypertension, Osteoarthritis",
            "chemotherapy": "Yes",
            "radiation": "No",
            "notes": "Patient presented with solitary 3.2cm RLL mass. Post-surgical candidate.",
            "assessment_status": "completed",
            "data_source": "Newly Created Assessments",
            "research_sample_id": 12,
            "research_split": "test"
        },
        {
            "id": "DEMO-0002",
            "patient_name": "Eleanor Vance",
            "created_at": now,
            "updated_at": now,
            "age": 72.0,
            "gender": "female",
            "smoking_history": "Nonsmoker",
            "smoking_pack_years": 0.0,
            "weight": 138.0,
            "occupation": "Senior Accountant",
            "address": "1208 Pine Crest Way, Raleigh, NC 27606",
            "histology": "squamous cell carcinoma",
            "cancer_type": "Non-Small Cell Lung Cancer",
            "t_stage": "3",
            "n_stage": "2",
            "m_stage": "0",
            "overall_stage": "IIIa",
            "clinical_stage": "Stage IIIA",
            "pathological_stage": "cT3N2M0",
            "performance_status": "ECOG 1",
            "egfr_status": "Negative",
            "kras_status": "Negative",
            "alk_status": "Positive",
            "other_biomarkers": "ALK rearrangement confirmed via FISH",
            "blood_workup": json.dumps({
                "cbc": {
                    "hemoglobin": {"value": 11.8, "unit": "g/dL", "ref_range": "12.0 - 16.0", "status": "Low"},
                    "wbc_count": {"value": 8.1, "unit": "10^3/µL", "ref_range": "4.5 - 11.0", "status": "Normal"},
                    "platelets": {"value": 310, "unit": "10^3/µL", "ref_range": "150 - 450", "status": "Normal"},
                    "rbc_count": {"value": 3.9, "unit": "10^6/µL", "ref_range": "4.0 - 5.2", "status": "Low"},
                    "neutrophils": {"value": 68.0, "unit": "%", "ref_range": "40.0 - 75.0", "status": "Normal"},
                    "lymphocytes": {"value": 22.0, "unit": "%", "ref_range": "20.0 - 45.0", "status": "Normal"}
                },
                "lft": {
                    "total_bilirubin": {"value": 0.6, "unit": "mg/dL", "ref_range": "0.2 - 1.2", "status": "Normal"},
                    "direct_bilirubin": {"value": 0.1, "unit": "mg/dL", "ref_range": "0.0 - 0.3", "status": "Normal"},
                    "ast_sgot": {"value": 19, "unit": "U/L", "ref_range": "10 - 40", "status": "Normal"},
                    "alt_sgpt": {"value": 22, "unit": "U/L", "ref_range": "7 - 56", "status": "Normal"},
                    "alp": {"value": 92, "unit": "U/L", "ref_range": "44 - 147", "status": "Normal"},
                    "total_protein": {"value": 6.8, "unit": "g/dL", "ref_range": "6.0 - 8.3", "status": "Normal"},
                    "albumin": {"value": 3.8, "unit": "g/dL", "ref_range": "3.5 - 5.0", "status": "Normal"}
                },
                "rft": {
                    "bun": {"value": 18.0, "unit": "mg/dL", "ref_range": "7.0 - 20.0", "status": "Normal"},
                    "serum_creatinine": {"value": 1.1, "unit": "mg/dL", "ref_range": "0.5 - 1.1", "status": "Normal"},
                    "egfr": {"value": 68.0, "unit": "mL/min/1.73m²", "ref_range": ">= 60.0", "status": "Normal"},
                    "uric_acid": {"value": 6.1, "unit": "mg/dL", "ref_range": "2.7 - 6.1", "status": "Normal"}
                },
                "electrolytes": {
                    "sodium": {"value": 138.0, "unit": "mEq/L", "ref_range": "135 - 145", "status": "Normal"},
                    "potassium": {"value": 4.5, "unit": "mEq/L", "ref_range": "3.5 - 5.0", "status": "Normal"},
                    "chloride": {"value": 99.0, "unit": "mEq/L", "ref_range": "96 - 106", "status": "Normal"},
                    "bicarbonate": {"value": 23.0, "unit": "mEq/L", "ref_range": "22 - 29", "status": "Normal"},
                    "calcium": {"value": 9.1, "unit": "mg/dL", "ref_range": "8.5 - 10.5", "status": "Normal"}
                },
                "report_notes": "Mild normocytic anemia noted; renal clearance adequate for targeted systemic agent administration."
            }),
            "medical_history": "Type 2 diabetes managed with metformin",
            "comorbidities": "Diabetes Mellitus, Hyperlipidemia",
            "chemotherapy": "No",
            "radiation": "Yes",
            "notes": "Central left upper lobe tumor abutting mediastinal pleura. Candidate for ALK inhibitor therapy.",
            "assessment_status": "completed",
            "data_source": "Newly Created Assessments",
            "research_sample_id": 45,
            "research_split": "test"
        },
        {
            "id": "DEMO-0003",
            "patient_name": "Marcus Holloway",
            "created_at": now,
            "updated_at": now,
            "age": 59.0,
            "gender": "male",
            "smoking_history": "Current Smoker",
            "smoking_pack_years": 45.0,
            "weight": 182.0,
            "occupation": "Commercial Logistics Specialist",
            "address": "884 Marina Boulevard, Seattle, WA 98121",
            "histology": "large cell",
            "cancer_type": "Non-Small Cell Lung Cancer",
            "t_stage": "1",
            "n_stage": "0",
            "m_stage": "0",
            "overall_stage": "I",
            "clinical_stage": "Stage IA2",
            "pathological_stage": "pT1bN0M0",
            "performance_status": "ECOG 0",
            "egfr_status": "Negative",
            "kras_status": "Positive",
            "alk_status": "Negative",
            "other_biomarkers": "KRAS G12C mutation identified",
            "blood_workup": json.dumps({
                "cbc": {
                    "hemoglobin": {"value": 15.3, "unit": "g/dL", "ref_range": "13.0 - 17.5", "status": "Normal"},
                    "wbc_count": {"value": 6.5, "unit": "10^3/µL", "ref_range": "4.5 - 11.0", "status": "Normal"},
                    "platelets": {"value": 220, "unit": "10^3/µL", "ref_range": "150 - 450", "status": "Normal"},
                    "rbc_count": {"value": 5.1, "unit": "10^6/µL", "ref_range": "4.3 - 5.9", "status": "Normal"},
                    "neutrophils": {"value": 58.0, "unit": "%", "ref_range": "40.0 - 75.0", "status": "Normal"},
                    "lymphocytes": {"value": 33.0, "unit": "%", "ref_range": "20.0 - 45.0", "status": "Normal"}
                },
                "lft": {
                    "total_bilirubin": {"value": 0.7, "unit": "mg/dL", "ref_range": "0.2 - 1.2", "status": "Normal"},
                    "direct_bilirubin": {"value": 0.1, "unit": "mg/dL", "ref_range": "0.0 - 0.3", "status": "Normal"},
                    "ast_sgot": {"value": 22, "unit": "U/L", "ref_range": "10 - 40", "status": "Normal"},
                    "alt_sgpt": {"value": 25, "unit": "U/L", "ref_range": "7 - 56", "status": "Normal"},
                    "alp": {"value": 76, "unit": "U/L", "ref_range": "44 - 147", "status": "Normal"},
                    "total_protein": {"value": 7.4, "unit": "g/dL", "ref_range": "6.0 - 8.3", "status": "Normal"},
                    "albumin": {"value": 4.5, "unit": "g/dL", "ref_range": "3.5 - 5.0", "status": "Normal"}
                },
                "rft": {
                    "bun": {"value": 13.0, "unit": "mg/dL", "ref_range": "7.0 - 20.0", "status": "Normal"},
                    "serum_creatinine": {"value": 0.8, "unit": "mg/dL", "ref_range": "0.6 - 1.3", "status": "Normal"},
                    "egfr": {"value": 98.0, "unit": "mL/min/1.73m²", "ref_range": ">= 60.0", "status": "Normal"},
                    "uric_acid": {"value": 4.9, "unit": "mg/dL", "ref_range": "3.5 - 7.2", "status": "Normal"}
                },
                "electrolytes": {
                    "sodium": {"value": 142.0, "unit": "mEq/L", "ref_range": "135 - 145", "status": "Normal"},
                    "potassium": {"value": 4.1, "unit": "mEq/L", "ref_range": "3.5 - 5.0", "status": "Normal"},
                    "chloride": {"value": 103.0, "unit": "mEq/L", "ref_range": "96 - 106", "status": "Normal"},
                    "bicarbonate": {"value": 26.0, "unit": "mEq/L", "ref_range": "22 - 29", "status": "Normal"},
                    "calcium": {"value": 9.6, "unit": "mg/dL", "ref_range": "8.5 - 10.5", "status": "Normal"}
                },
                "report_notes": "All hematologic, renal and hepatic profiles within baseline reference tolerance for surgical planning."
            }),
            "medical_history": "COPD GOLD Stage 1, chronic bronchitis",
            "comorbidities": "COPD",
            "chemotherapy": "No",
            "radiation": "No",
            "notes": "Screening-detected 1.8cm peripheral nodule in right upper lobe. Underwent VATS segmentectomy.",
            "assessment_status": "completed",
            "data_source": "Newly Created Assessments",
            "research_sample_id": 88,
            "research_split": "test"
        }
    ]

    for item in seed_cases:
        cursor.execute("""
        INSERT INTO assessments (
            id, patient_name, created_at, updated_at, age, gender, smoking_history, smoking_pack_years, weight,
            occupation, address, histology, cancer_type, t_stage, n_stage, m_stage, overall_stage, clinical_stage,
            pathological_stage, performance_status, egfr_status, kras_status, alk_status,
            other_biomarkers, blood_workup, medical_history, comorbidities, chemotherapy, radiation, notes,
            assessment_status, data_source, research_sample_id, research_split
        ) VALUES (
            :id, :patient_name, :created_at, :updated_at, :age, :gender, :smoking_history, :smoking_pack_years, :weight,
            :occupation, :address, :histology, :cancer_type, :t_stage, :n_stage, :m_stage, :overall_stage, :clinical_stage,
            :pathological_stage, :performance_status, :egfr_status, :kras_status, :alk_status,
            :other_biomarkers, :blood_workup, :medical_history, :comorbidities, :chemotherapy, :radiation, :notes,
            :assessment_status, :data_source, :research_sample_id, :research_split
        )
        """, item)


def generate_next_assessment_id() -> str:
    """Generate next sequential assessment ID (e.g. DEMO-0004)."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM assessments WHERE id LIKE 'DEMO-%' ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()

    if row and row["id"]:
        try:
            num = int(row["id"].split("-")[1])
            return f"DEMO-{num + 1:04d}"
        except Exception:
            pass
    return f"DEMO-{uuid.uuid4().hex[:6].upper()}"


def save_assessment_record(data: Dict[str, Any]) -> Dict[str, Any]:
    """Persist a new assessment record to SQLite."""
    conn = get_connection()
    cursor = conn.cursor()

    assessment_id = data.get("id") or generate_next_assessment_id()
    now = datetime.now().isoformat()
    patient_name = str(data.get("patient_name", "")).strip() or "Anonymous Patient"

    blood_workup_val = data.get("blood_workup")
    if isinstance(blood_workup_val, (dict, list)):
        blood_workup_str = json.dumps(blood_workup_val)
    else:
        blood_workup_str = blood_workup_val

    record = {
        "id": assessment_id,
        "patient_name": patient_name,
        "created_at": data.get("created_at", now),
        "updated_at": now,
        "age": float(data.get("age", 65)),
        "gender": str(data.get("gender", "male")).lower(),
        "occupation": data.get("occupation", "Unspecified"),
        "address": data.get("address", "Not provided"),
        "smoking_history": data.get("smoking_history", "Unknown"),
        "smoking_pack_years": float(data["smoking_pack_years"]) if data.get("smoking_pack_years") is not None else None,
        "weight": float(data["weight"]) if data.get("weight") is not None else None,
        "histology": str(data.get("histology", "adenocarcinoma")),
        "cancer_type": data.get("cancer_type", "Non-Small Cell Lung Cancer"),
        "t_stage": str(data.get("t_stage", "1")),
        "n_stage": str(data.get("n_stage", "0")),
        "m_stage": str(data.get("m_stage", "0")),
        "overall_stage": str(data.get("overall_stage", "I")),
        "clinical_stage": data.get("clinical_stage", f"Stage {data.get('overall_stage', 'I')}"),
        "pathological_stage": data.get("pathological_stage"),
        "performance_status": data.get("performance_status", "ECOG 0"),
        "egfr_status": data.get("egfr_status", "Unknown"),
        "kras_status": data.get("kras_status", "Unknown"),
        "alk_status": data.get("alk_status", "Unknown"),
        "other_biomarkers": data.get("other_biomarkers"),
        "blood_workup": blood_workup_str,
        "medical_history": data.get("medical_history"),
        "comorbidities": data.get("comorbidities"),
        "chemotherapy": data.get("chemotherapy", "No"),
        "radiation": data.get("radiation", "No"),
        "notes": data.get("notes"),
        "assessment_status": data.get("assessment_status", "completed"),
        "data_source": "Newly Created Assessments",
        "research_sample_id": data.get("research_sample_id"),
        "research_split": data.get("research_split", "test")
    }

    cursor.execute("""
    INSERT INTO assessments (
        id, patient_name, created_at, updated_at, age, gender, occupation, address, smoking_history, smoking_pack_years, weight,
        histology, cancer_type, t_stage, n_stage, m_stage, overall_stage, clinical_stage,
        pathological_stage, performance_status, egfr_status, kras_status, alk_status,
        other_biomarkers, blood_workup, medical_history, comorbidities, chemotherapy, radiation, notes,
        assessment_status, data_source, research_sample_id, research_split
    ) VALUES (
        :id, :patient_name, :created_at, :updated_at, :age, :gender, :occupation, :address, :smoking_history, :smoking_pack_years, :weight,
        :histology, :cancer_type, :t_stage, :n_stage, :m_stage, :overall_stage, :clinical_stage,
        :pathological_stage, :performance_status, :egfr_status, :kras_status, :alk_status,
        :other_biomarkers, :blood_workup, :medical_history, :comorbidities, :chemotherapy, :radiation, :notes,
        :assessment_status, :data_source, :research_sample_id, :research_split
    )
    """, record)

    conn.commit()
    conn.close()
    record["blood_workup"] = blood_workup_val
    return record


def get_assessment_by_id(assessment_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve full assessment details and attached images from SQLite."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM assessments WHERE id = ?", (assessment_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None

    assessment = dict(row)
    if assessment.get("blood_workup") and isinstance(assessment["blood_workup"], str):
        try:
            assessment["blood_workup"] = json.loads(assessment["blood_workup"])
        except Exception:
            pass

    # Attach images
    cursor.execute("SELECT * FROM medical_images WHERE assessment_id = ? ORDER BY upload_timestamp DESC", (assessment_id,))
    images = [dict(img) for img in cursor.fetchall()]
    assessment["images"] = images

    conn.close()
    return assessment


def list_all_assessments(limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
    """List all persisted assessments with image counts."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT a.*, COUNT(m.id) as image_count
    FROM assessments a
    LEFT JOIN medical_images m ON a.id = m.assessment_id
    GROUP BY a.id
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
    """, (limit, offset))

    rows = []
    for r in cursor.fetchall():
        d = dict(r)
        if d.get("blood_workup") and isinstance(d["blood_workup"], str):
            try:
                d["blood_workup"] = json.loads(d["blood_workup"])
            except Exception:
                pass
        rows.append(d)
    conn.close()
    return rows


def update_assessment_record(assessment_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Update fields of an existing assessment."""
    conn = get_connection()
    cursor = conn.cursor()

    existing = get_assessment_by_id(assessment_id)
    if not existing:
        conn.close()
        return None

    now = datetime.now().isoformat()
    fields = []
    values = []

    for key, val in data.items():
        if key not in ["id", "created_at", "images"]:
            fields.append(f"{key} = ?")
            values.append(val)

    fields.append("updated_at = ?")
    values.append(now)
    values.append(assessment_id)

    query = f"UPDATE assessments SET {', '.join(fields)} WHERE id = ?"
    cursor.execute(query, values)
    conn.commit()
    conn.close()

    return get_assessment_by_id(assessment_id)


def delete_assessment_record(assessment_id: str) -> bool:
    """Delete assessment and remove attached image files from disk."""
    conn = get_connection()
    cursor = conn.cursor()

    # Get images to remove from disk
    cursor.execute("SELECT file_path FROM medical_images WHERE assessment_id = ?", (assessment_id,))
    files = cursor.fetchall()
    for f in files:
        if f["file_path"] and os.path.exists(f["file_path"]):
            try:
                os.remove(f["file_path"])
            except Exception:
                pass

    cursor.execute("DELETE FROM medical_images WHERE assessment_id = ?", (assessment_id,))
    cursor.execute("DELETE FROM assessments WHERE id = ?", (assessment_id,))
    conn.commit()
    changes = conn.total_changes
    conn.close()
    return changes > 0


def add_medical_image_record(
    assessment_id: str,
    original_filename: str,
    stored_filename: str,
    file_format: str,
    file_size: int,
    image_dimensions: str,
    image_type: str,
    file_path: str,
    processing_status: str = "stored"
) -> Dict[str, Any]:
    """Record an uploaded image metadata row."""
    conn = get_connection()
    cursor = conn.cursor()

    image_id = f"IMG-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.now().isoformat()

    record = {
        "id": image_id,
        "assessment_id": assessment_id,
        "original_filename": original_filename,
        "stored_filename": stored_filename,
        "file_format": file_format.lower().replace(".", ""),
        "file_size": file_size,
        "upload_timestamp": now,
        "image_dimensions": image_dimensions,
        "image_type": image_type,
        "processing_status": processing_status,
        "file_path": file_path
    }

    cursor.execute("""
    INSERT INTO medical_images (
        id, assessment_id, original_filename, stored_filename, file_format,
        file_size, upload_timestamp, image_dimensions, image_type, processing_status, file_path
    ) VALUES (
        :id, :assessment_id, :original_filename, :stored_filename, :file_format,
        :file_size, :upload_timestamp, :image_dimensions, :image_type, :processing_status, :file_path
    )
    """, record)

    conn.commit()
    conn.close()
    return record


def get_medical_image_by_id(image_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve metadata for a specific uploaded image."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM medical_images WHERE id = ?", (image_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def delete_medical_image_by_id(image_id: str) -> bool:
    """Delete image row and remove file from disk."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT file_path FROM medical_images WHERE id = ?", (image_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return False

    if row["file_path"] and os.path.exists(row["file_path"]):
        try:
            os.remove(row["file_path"])
        except Exception:
            pass

    cursor.execute("DELETE FROM medical_images WHERE id = ?", (image_id,))
    conn.commit()
    conn.close()
    return True


def get_new_assessments_analytics() -> Dict[str, Any]:
    """
    Compute real-time aggregated metrics across all newly created assessments
    persisted in SQLite. Feeds dynamically into the Analytics Workspace.
    """
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as total FROM assessments")
    total_assessments = cursor.fetchone()["total"]

    if total_assessments == 0:
        conn.close()
        return {
            "total_assessments": 0,
            "avg_age": 0,
            "stage_distribution": [],
            "gender_distribution": [],
            "histology_distribution": [],
            "biomarker_summary": {},
            "image_upload_stats": {"total_images": 0, "assessments_with_images": 0},
            "activity_timeline": []
        }

    # Average age
    cursor.execute("SELECT AVG(age) as avg_age, MIN(age) as min_age, MAX(age) as max_age FROM assessments")
    age_row = cursor.fetchone()
    avg_age = round(float(age_row["avg_age"] or 0), 1)

    # Stage distribution
    cursor.execute("SELECT overall_stage, COUNT(*) as count FROM assessments GROUP BY overall_stage ORDER BY count DESC")
    stage_dist = [{"stage": r["overall_stage"], "count": r["count"]} for r in cursor.fetchall()]

    # Gender distribution
    cursor.execute("SELECT gender, COUNT(*) as count FROM assessments GROUP BY gender")
    gender_dist = [{"gender": r["gender"].capitalize(), "count": r["count"]} for r in cursor.fetchall()]

    # Histology distribution
    cursor.execute("SELECT histology, COUNT(*) as count FROM assessments GROUP BY histology ORDER BY count DESC")
    hist_dist = [{"histology": r["histology"], "count": r["count"]} for r in cursor.fetchall()]

    # Biomarkers
    cursor.execute("SELECT egfr_status, COUNT(*) as count FROM assessments GROUP BY egfr_status")
    egfr_dist = {r["egfr_status"]: r["count"] for r in cursor.fetchall()}

    cursor.execute("SELECT kras_status, COUNT(*) as count FROM assessments GROUP BY kras_status")
    kras_dist = {r["kras_status"]: r["count"] for r in cursor.fetchall()}

    cursor.execute("SELECT alk_status, COUNT(*) as count FROM assessments GROUP BY alk_status")
    alk_dist = {r["alk_status"]: r["count"] for r in cursor.fetchall()}

    # Image stats
    cursor.execute("SELECT COUNT(*) as total_images FROM medical_images")
    total_images = cursor.fetchone()["total_images"]

    cursor.execute("SELECT COUNT(DISTINCT assessment_id) as with_images FROM medical_images")
    with_images = cursor.fetchone()["with_images"]

    # Image format breakdown
    cursor.execute("SELECT file_format, COUNT(*) as count FROM medical_images GROUP BY file_format")
    format_breakdown = [{"format": (r["file_format"] or "unknown").upper(), "count": r["count"]} for r in cursor.fetchall()]

    # Image modality breakdown
    cursor.execute("SELECT image_type, COUNT(*) as count FROM medical_images GROUP BY image_type")
    type_breakdown = [{"type": (r["image_type"] or "CT Scan").upper(), "count": r["count"]} for r in cursor.fetchall()]

    # Latest assessment
    cursor.execute("SELECT id, created_at FROM assessments ORDER BY created_at DESC LIMIT 1")
    latest_row = cursor.fetchone()
    latest_assessment = {"id": latest_row["id"], "created_at": latest_row["created_at"]} if latest_row else None

    # Activity by date (YYYY-MM-DD)
    cursor.execute("""
    SELECT substr(created_at, 1, 10) as day, COUNT(*) as count
    FROM assessments
    GROUP BY day
    ORDER BY day ASC
    """)
    timeline = [{"date": r["day"], "assessments": r["count"]} for r in cursor.fetchall()]

    conn.close()

    return {
        "total_assessments": total_assessments,
        "avg_age": avg_age,
        "age_range": {"min": age_row["min_age"], "max": age_row["max_age"]},
        "stage_distribution": stage_dist,
        "gender_distribution": gender_dist,
        "histology_distribution": hist_dist,
        "biomarkers": {
            "egfr": egfr_dist,
            "kras": kras_dist,
            "alk": alk_dist
        },
        "image_upload_stats": {
            "total_images": total_images,
            "assessments_with_images": with_images,
            "upload_rate_pct": round((with_images / total_assessments) * 100, 1) if total_assessments > 0 else 0,
            "format_breakdown": format_breakdown,
            "type_breakdown": type_breakdown,
        },
        "latest_assessment": latest_assessment,
        "activity_timeline": timeline,
        "data_source": "Newly Created Assessments (SQLite Storage)"
    }


# Auto-initialize database on import
init_db()
