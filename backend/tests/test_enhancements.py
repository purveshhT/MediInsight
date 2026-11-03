import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.api.datasets import list_datasets, explore_dataset
from app.api.assessment import (
    get_assessment, create_assessment, AssessmentCreateRequest,
    analyze_uploaded_image
)
from app.database.db import add_medical_image_record, get_connection
import pydantic


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
    # 4a. Validate patient_name is required
    try:
        invalid_patient = AssessmentCreateRequest(
            patient_name="",  # Should fail validation (min_length=1)
            age=61.0,
            gender="female",
            histology="adenocarcinoma",
            overall_stage="II"
        )
        assert False, "Should have failed validation for empty patient_name"
    except (pydantic.ValidationError, ValueError):
        print("  [PASS] Empty patient_name rejected by validation as required")

    new_patient = AssessmentCreateRequest(
        patient_name="Priya Patil",
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
    print(f"Retrieved Patient Name: {retrieved.get('patient_name')}")
    print(f"Retrieved Occupation: {retrieved['occupation']}")
    print(f"Retrieved Address: {retrieved['address']}")
    print(f"Retrieved CBC Hb: {retrieved['blood_workup']['cbc']['hemoglobin']}")
    print(f"Retrieved RFT Creatinine: {retrieved['blood_workup']['rft']['serum_creatinine']}")
    print(f"Retrieved Electrolytes Na+: {retrieved['blood_workup']['electrolytes']['sodium']}")

    assert retrieved["patient_name"] == "Priya Patil"
    assert retrieved["occupation"] == "Biomedical Systems Researcher"
    assert "Springfield" in retrieved["address"]
    assert retrieved["blood_workup"]["cbc"]["hemoglobin"]["value"] == 13.5
    assert retrieved["blood_workup"]["rft"]["serum_creatinine"]["value"] == 0.85
    assert retrieved["blood_workup"]["electrolytes"]["sodium"]["value"] == 139.0

    print("\n=== 6. VERIFY IDENTICAL PATIENT NAMES YIELD DISTINCT IDS ===")
    duplicate_name_patient = AssessmentCreateRequest(
        patient_name="Priya Patil",
        age=45.0,
        gender="female",
        histology="adenocarcinoma",
        overall_stage="I",
        occupation="School Teacher",
        address="102 Lake View, Mumbai, MH"
    )
    dup_res = create_assessment(duplicate_name_patient)
    dup_id = dup_res["assessment_id"]
    assert dup_id != new_id, "Assessments with identical names must have distinct IDs"
    dup_get = get_assessment(dup_id)["assessment"]
    orig_get = get_assessment(new_id)["assessment"]
    assert dup_get["patient_name"] == "Priya Patil"
    assert orig_get["patient_name"] == "Priya Patil"
    assert dup_get["age"] == 45.0
    assert orig_get["age"] == 61.0
    print(f"  [PASS] Identical names handled properly: ID1={new_id} (age 61), ID2={dup_id} (age 45)")

    print("\n=== 7. STRICT MEDICAL IMAGE DATA INTEGRITY & ISOLATION CHECKS ===")
    # 7a. Assessment with no image has empty images list (never fallback or NoduleMNIST3D)
    assert len(get_res["images"]) == 0, "New assessment with no upload must have 0 attached images"
    assert len(dup_get["images"]) == 0, "Duplicate name assessment must have 0 attached images"
    print("  [PASS] No uploaded image yields exactly 0 attached images (no fallback/default)")

    # 7b. Create an image record for new_id and verify it attaches strictly to new_id
    import tempfile
    from PIL import Image as PILImage
    import numpy as np

    # Generate a dummy test CT slice image
    temp_img_file = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
    test_arr = (np.random.rand(64, 64) * 255).astype(np.uint8)
    PILImage.fromarray(test_arr).save(temp_img_file.name)
    temp_img_file.close()

    img_meta = add_medical_image_record(
        assessment_id=new_id,
        original_filename="patient_priya_ct_slice.png",
        stored_filename=os.path.basename(temp_img_file.name),
        file_format="png",
        file_size=os.path.getsize(temp_img_file.name),
        image_dimensions="64x64",
        image_type="CT",
        file_path=temp_img_file.name
    )
    img_id = img_meta["id"]

    # Verify new_id now has 1 image
    updated_new = get_assessment(new_id)
    assert len(updated_new["images"]) == 1
    assert updated_new["images"][0]["original_filename"] == "patient_priya_ct_slice.png"
    print(f"  [PASS] Uploaded scan {img_id} properly linked to patient {new_id}")

    # Verify dup_id and DEMO-0001 still have 0 attached images (strict isolation)
    check_dup = get_assessment(dup_id)
    check_demo1 = get_assessment("DEMO-0001")
    assert len(check_dup["images"]) == 0, "Scan must not leak to duplicate named patient"
    assert len(check_demo1["images"]) == 0, "Scan must not leak to DEMO-0001"
    print("  [PASS] Strict patient scan isolation verified: image does not leak to other patients")

    # 7c. Test radiometric profiling endpoint on the uploaded scan
    analysis_res = analyze_uploaded_image(new_id, img_id)
    assert analysis_res["status"] == "success"
    assert analysis_res["analysis_status"] == "Completed - 2D Radiometric Profiling"
    assert "mean_attenuation" in analysis_res["metrics"]
    print(f"  [PASS] Radiometric profiling succeeded on uploaded image: mean={analysis_res['metrics']['mean_attenuation']}")

    # Clean up temp image
    if os.path.exists(temp_img_file.name):
        os.remove(temp_img_file.name)

    print("\n[ALL TESTS PASSED SUCCESSFULLY]")


if __name__ == "__main__":
    run_tests()
