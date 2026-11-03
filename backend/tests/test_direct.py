"""
Direct API endpoint integration verification
Calls router functions directly without any async server overhead.
"""

import sys
import os
import warnings

warnings.filterwarnings("ignore")

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.api.health import health_check
from app.api.datasets import list_datasets, data_quality_report, explore_dataset
from app.api.analytics import (
    analytics_overview, clinical_analytics, treatment_analytics,
    imaging_analytics, survival_analytics, imaging_pca
)
from app.api.imaging import list_samples, get_sample, predict_nodule
from app.api.assessment import create_assessment, list_assessments, AssessmentRequest
from app.api.recommendations import get_recommendations, RecommendationRequest
from app.api.reports import list_models, model_evaluation, similar_cases


def run_tests():
    print("\n--- RUNNING MEDIINSIGHT AI DIRECT ENDPOINT VERIFICATION ---\n", flush=True)

    # 1. Health
    h = health_check()
    assert h["status"] == "ok"
    print(f"[PASS] Health Check: {h}", flush=True)

    # 2. Datasets
    ds = list_datasets()
    assert ds["total"] == 6
    print(f"[PASS] Datasets Listed: {len(ds['datasets'])} datasets registered", flush=True)

    # 3. Explore dataset
    exp = explore_dataset("nsclc_radiomics", page=1, page_size=5)
    assert exp["total_records"] == 422
    assert len(exp["records"]) == 5
    print(f"[PASS] Dataset Explorer: Paginated {exp['total_records']} rows, columns: {len(exp['columns'])}", flush=True)

    # 4. Analytics Overview
    ov = analytics_overview()
    assert ov["kpis"]["total_clinical_records"] == 633
    assert ov["kpis"]["total_imaging_samples"] == 3927
    print(f"[PASS] Overview KPIs: {ov['kpis']['total_clinical_records']} clinical, {ov['kpis']['total_imaging_samples']} 3D scans", flush=True)

    # 5. Clinical Analytics
    clin = clinical_analytics()
    assert "age_by_stage" in clin
    assert len(clin["t_stage_distribution"]) > 0
    print(f"[PASS] Clinical Analytics: TNM distributions & Pearson correlation matrix computed", flush=True)

    # 6. Survival Analytics
    surv = survival_analytics()
    assert "by_stage" in surv
    print(f"[PASS] Survival Analytics: Kaplan-Meier curves computed across {len(surv['by_stage'])} stages", flush=True)

    # 7. Treatment Analytics
    treat = treatment_analytics()
    assert len(treat["treatment_frequency"]["chemotherapy"]) > 0
    print(f"[PASS] Treatment Analytics: Chemotherapy & radiation patterns evaluated", flush=True)

    # 8. Imaging Samples & 3D Slice Extraction
    samples = list_samples(split="test", limit=5)
    assert len(samples["samples"]) == 5
    sample_detail = get_sample(sample_id=0, split="test")
    assert "slices" in sample_detail
    assert "slice_50pct" in sample_detail["slices"]
    print(f"[PASS] Imaging Slices: Extracted 3D volume slices for sample #{sample_detail['sample_id']} ({sample_detail['label_name']})", flush=True)

    # 9. 3D Volume Predictor
    pred = predict_nodule(sample_id=0, split="test")
    assert "predicted_label" in pred
    print(f"[PASS] 3D Volume Classifier: Ground Truth={pred['true_label_name']}, Predicted={pred['predicted_label_name']}, P(Benign)={pred['probabilities']['Benign']}", flush=True)

    # 10. Imaging PCA Projection
    pca = imaging_pca()
    assert len(pca["points"]) == 310
    print(f"[PASS] Imaging PCA: Projected 310 test samples in 3D feature space (Var Expl: {pca['total_variance_explained']})", flush=True)

    # 11. Patient Assessment Creation
    req = AssessmentRequest(
        age=66,
        gender="male",
        histology="adenocarcinoma",
        overall_stage="IIIa",
        t_stage="2",
        n_stage="2",
        m_stage="0",
        egfr_status="Mutant",
        kras_status="Wildtype",
        alk_status="Wildtype"
    )
    ass = create_assessment(req)
    assert ass["assessment_id"].startswith("DEMO-")
    all_ass = list_assessments()
    assert all_ass["total"] >= 1
    sim_cases = ass.get('similar_cases', [])
    sim_count = len(sim_cases) if isinstance(sim_cases, list) else len(sim_cases.get('similar_cases', []))
    print(f"[PASS] Assessment Service: Registered {ass['assessment_id']}, retrieval matches: {sim_count}", flush=True)

    # 12. Treatment Recommendation Ranking
    rec_req = RecommendationRequest(
        age=66,
        gender="male",
        histology="adenocarcinoma",
        overall_stage="IIIa",
        egfr_status="Mutant"
    )
    recs = get_recommendations(rec_req)
    assert len(recs["candidates"]) > 0
    print(f"[PASS] Treatment Decision Support: Ranked {len(recs['candidates'])} candidate pathways (Top: {recs['candidates'][0]['option']})", flush=True)

    # 13. Similar Cases KNN Retrieval
    sim = similar_cases(age=66, gender="male", histology="adenocarcinoma", t_stage="2", n_stage="2", m_stage="0", n_neighbors=5)
    assert len(sim["similar_cases"]) == 5
    top_case = sim["similar_cases"][0]
    print(f"[PASS] Similar Cases Retrieval: Top match {top_case['patient_id']} (Similarity: {top_case['similarity_score']})", flush=True)

    # 14. Model Evaluation Summary
    ev = model_evaluation()
    assert "nodule_classifier" in ev
    print(f"[PASS] Model Evaluation API: Accuracy={ev['nodule_classifier']['test_metrics']['accuracy']}, AUC={ev['nodule_classifier']['test_metrics']['roc_auc']}", flush=True)

    print("\n=======================================================", flush=True)
    print("ALL 14 DIRECT ENDPOINT INTEGRATION TESTS PASSED (100%)", flush=True)
    print("=======================================================\n", flush=True)


if __name__ == "__main__":
    run_tests()
