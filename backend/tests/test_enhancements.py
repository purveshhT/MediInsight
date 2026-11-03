import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.api.datasets import list_datasets, explore_dataset
from app.api.assessment import get_assessment, create_assessment, AssessmentCreateRequest


def run_tests():
    print("=== 1. DATASETS LIST ===")
    ds_res = list_datasets()
    datasets = ds_res["datasets"]
    print(f"Total registered datasets: {len(datasets)}")
    for d in datasets:
        rec = d.get("total_records") or d.get("total_samples") or "N/A"
        print(f"  - [{d['id']}] {d['name']} ({rec} records)")

    assert any(d["id"] == "iq_othnccd" for d in datasets), "iq_othnccd missing"
    assert any(d["id"] == "chest_ct_subtypes" for d in datasets), "chest_ct_subtypes missing"

    print("\n=== 2. DATASET EXPLORER CHECKS ===")
    iq_data = explore_dataset("iq_othnccd", page=1, page_size=5)
    print(f"IQ-OTH/NCCD total records: {iq_data['total_records']}, sample class: {iq_data['records'][0]['class_label']}")
    assert iq_data["total_records"] == 1294

    cct_data = explore_dataset("chest_ct_subtypes", page=1, page_size=5)
    print(f"Chest CT Subtypes total records: {cct_data['total_records']}, sample histology: {cct_data['records'][0]['histology']}, stage: {cct_data['records'][0]['overall_stage']}")
    assert cct_data["total_records"] == 1000

    print("\n=== 3. DEMO-0001 PREVIOUS RECORD RETRIEVAL ===")
    demo1 = get_assessment("DEMO-0001")
    ass1 = demo1["assessment"]
    print(f"DEMO-0001 Occupation: {ass1.get('occupation')}")
    print(f"DEMO-0001 Address: {ass1.get('address')}")
    print(f"DEMO-0001 Blood Workup CBC Hb: {ass1.get('blood_workup', {}).get('cbc', {}).get('hemoglobin')}")
    assert ass1.get("occupation") is not None

    print("\n=== 4. CREATE NEW PATIENT ASSESSMENT WITH OCCUPATION, ADDRESS, AND BLOOD WORKUP ===")
    new_patient = AssessmentCreateRequest(
        age=61.0,
        gender="female",
        occupation="Biomedical Systems Researcher",
        address="742 Evergreen Terrace, Springfield, OR 97477",
        smoking_history="Former Smoker",
        smoking_pack_years=15.0,
        weight=142.0,
        histology="adenocarcinoma",
        overall_stage="II",
        t_stage="2",
        n_stage="1",
        m_stage="0",
        egfr_status="Positive",
        kras_status="Negative",
        alk_status="Negative",
        blood_workup={
            "cbc": {
                "hemoglobin": {"value": 13.5, "unit": "g/dL", "ref_range": "12.0 - 16.0", "status": "Normal"},
                "wbc_count": {"value": 6.9, "unit": "10^3/µL", "ref_range": "4.5 - 11.0", "status": "Normal"},
                "platelets": {"value": 280, "unit": "10^3/µL", "ref_range": "150 - 450", "status": "Normal"},
                "rbc_count": {"value": 4.6, "unit": "10^6/µL", "ref_range": "4.0 - 5.2", "status": "Normal"},
                "neutrophils": {"value": 60.0, "unit": "%", "ref_range": "40.0 - 75.0", "status": "Normal"},
                "lymphocytes": {"value": 30.0, "unit": "%", "ref_range": "20.0 - 45.0", "status": "Normal"}
            },
            "lft": {
                "total_bilirubin": {"value": 0.7, "unit": "mg/dL", "ref_range": "0.2 - 1.2", "status": "Normal"},
                "direct_bilirubin": {"value": 0.15, "unit": "mg/dL", "ref_range": "0.0 - 0.3", "status": "Normal"},
                "ast_sgot": {"value": 22, "unit": "U/L", "ref_range": "10 - 40", "status": "Normal"},
                "alt_sgpt": {"value": 25, "unit": "U/L", "ref_range": "7 - 56", "status": "Normal"},
                "alp": {"value": 80, "unit": "U/L", "ref_range": "44 - 147", "status": "Normal"},
                "total_protein": {"value": 7.0, "unit": "g/dL", "ref_range": "6.0 - 8.3", "status": "Normal"},
                "albumin": {"value": 4.1, "unit": "g/dL", "ref_range": "3.5 - 5.0", "status": "Normal"}
            },
            "rft": {
                "bun": {"value": 14.0, "unit": "mg/dL", "ref_range": "7.0 - 20.0", "status": "Normal"},
                "serum_creatinine": {"value": 0.85, "unit": "mg/dL", "ref_range": "0.5 - 1.1", "status": "Normal"},
                "egfr": {"value": 94.0, "unit": "mL/min/1.73m²", "ref_range": ">= 60.0", "status": "Normal"},
                "uric_acid": {"value": 5.1, "unit": "mg/dL", "ref_range": "2.7 - 6.1", "status": "Normal"}
            },
            "electrolytes": {
                "sodium": {"value": 139.0, "unit": "mEq/L", "ref_range": "135 - 145", "status": "Normal"},
                "potassium": {"value": 4.1, "unit": "mEq/L", "ref_range": "3.5 - 5.0", "status": "Normal"},
                "chloride": {"value": 100.0, "unit": "mEq/L", "ref_range": "96 - 106", "status": "Normal"},
                "bicarbonate": {"value": 24.0, "unit": "mEq/L", "ref_range": "22 - 29", "status": "Normal"},
                "calcium": {"value": 9.3, "unit": "mg/dL", "ref_range": "8.5 - 10.5", "status": "Normal"}
            },
            "report_notes": "All hematological, hepatic, renal, and electrolyte parameters within adult reference ranges."
        }
    )

    create_res = create_assessment(new_patient)
    new_id = create_res["assessment_id"]
    print(f"Created Assessment ID: {new_id}")

    print("\n=== 5. RETRIEVE NEWLY CREATED ASSESSMENT ===")
    get_res = get_assessment(new_id)
    retrieved = get_res["assessment"]
    print(f"Retrieved ID: {retrieved['id']}")
    print(f"Retrieved Occupation: {retrieved['occupation']}")
    print(f"Retrieved Address: {retrieved['address']}")
    print(f"Retrieved CBC Hb: {retrieved['blood_workup']['cbc']['hemoglobin']}")
    print(f"Retrieved RFT Creatinine: {retrieved['blood_workup']['rft']['serum_creatinine']}")
    print(f"Retrieved Electrolytes Na+: {retrieved['blood_workup']['electrolytes']['sodium']}")

    assert retrieved["occupation"] == "Biomedical Systems Researcher"
    assert "Springfield" in retrieved["address"]
    assert retrieved["blood_workup"]["cbc"]["hemoglobin"]["value"] == 13.5
    assert retrieved["blood_workup"]["rft"]["serum_creatinine"]["value"] == 0.85
    assert retrieved["blood_workup"]["electrolytes"]["sodium"]["value"] == 139.0

    print("\n[ALL TESTS PASSED SUCCESSFULLY]")


if __name__ == "__main__":
    run_tests()
