"""
Automated Integration Test Suite for MediInsight AI Backend APIs
"""

import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
    print("✓ Health Check Passed", flush=True)


def test_datasets():
    res = client.get("/api/datasets")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 4
    print("✓ Datasets Registry Passed (4 Datasets Listed)", flush=True)


def test_data_quality():
    res = client.get("/api/datasets/quality")
    assert res.status_code == 200
    data = res.json()
    assert "nsclc_radiomics" in data
    assert "nodulemnist3d" in data
    print("✓ Data Quality Profiler Passed", flush=True)


def test_analytics_overview():
    res = client.get("/api/analytics/overview")
    assert res.status_code == 200
    data = res.json()
    assert data["kpis"]["total_clinical_records"] == 633
    assert data["kpis"]["total_imaging_samples"] == 1633
    print("✓ Healthcare Analytics Overview Passed", flush=True)


def test_clinical_analytics():
    res = client.get("/api/analytics/clinical")
    assert res.status_code == 200
    data = res.json()
    assert "age_by_stage" in data
    assert "t_stage_distribution" in data
    print("✓ Clinical Analytics Passed", flush=True)


def test_treatment_analytics():
    res = client.get("/api/analytics/treatment")
    assert res.status_code == 200
    data = res.json()
    assert "treatment_frequency" in data
    assert "biomarkers" in data
    print("✓ Treatment Analytics Passed", flush=True)


def test_imaging_samples():
    res = client.get("/api/imaging/samples?split=test&limit=10")
    assert res.status_code == 200
    data = res.json()
    assert data["returned"] == 10
    sample_id = data["samples"][0]["sample_id"]

    # Sample detail
    detail = client.get(f"/api/imaging/samples/{sample_id}?split=test")
    assert detail.status_code == 200
    assert "slices" in detail.json()
    print("✓ Medical Imaging Samples & 3D Slice Extraction Passed", flush=True)


def test_imaging_predict():
    res = client.post("/api/imaging/predict?sample_id=0&split=test")
    assert res.status_code == 200
    data = res.json()
    assert "predicted_label" in data
    assert "probabilities" in data
    print(f"✓ 3D Volume Predictor Passed (Predicted: {data['predicted_label_name']})", flush=True)


def test_assessment_flow():
    payload = {
        "age": 62,
        "gender": "female",
        "histology": "adenocarcinoma",
        "overall_stage": "II",
        "t_stage": "2",
        "n_stage": "0",
        "m_stage": "0",
        "egfr_status": "Mutant",
        "kras_status": "Wildtype",
        "alk_status": "Wildtype",
        "imaging_sample_id": 5,
        "imaging_split": "test",
    }
    create_res = client.post("/api/assessment", json=payload)
    assert create_res.status_code == 200
    ass_id = create_res.json()["assessment_id"]

    list_res = client.get("/api/assessment")
    assert list_res.status_code == 200
    assert any(a["assessment_id"] == ass_id for a in list_res.json()["assessments"])
    print("✓ Patient Assessment Creation & Audit Log Passed", flush=True)


def test_recommendations():
    payload = {
        "age": 65,
        "gender": "male",
        "histology": "adenocarcinoma",
        "overall_stage": "IIIa",
        "t_stage": "2",
        "n_stage": "2",
        "m_stage": "0",
        "egfr_status": "Mutant",
        "kras_status": "Wildtype",
        "alk_status": "Wildtype",
    }
    res = client.post("/api/recommendations", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["candidates"]) > 0
    assert data["status"] == "experimental"
    print("✓ Treatment Recommendations Candidate Ranking Passed", flush=True)


def test_similar_cases():
    res = client.get("/api/reports/similar-cases?age=65&gender=male&histology=adenocarcinoma&t_stage=2&n_stage=1&m_stage=0&n_neighbors=5")
    assert res.status_code == 200
    data = res.json()
    assert len(data["similar_cases"]) == 5
    print("✓ Clinical Similar Cases Nearest-Neighbor Retrieval Passed", flush=True)


if __name__ == "__main__":
    print("\n--- RUNNING MEDIINSIGHT AI INTEGRATION TESTS ---\n", flush=True)
    test_health()
    test_datasets()
    test_data_quality()
    test_analytics_overview()
    test_clinical_analytics()
    test_treatment_analytics()
    test_imaging_samples()
    test_imaging_predict()
    test_assessment_flow()
    test_recommendations()
    test_similar_cases()
    print("\n============================================", flush=True)
    print("ALL 11 BACKEND API TEST SUITES PASSED (100%)", flush=True)
    print("============================================\n", flush=True)
