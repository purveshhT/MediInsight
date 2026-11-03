from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class RecommendationRequest(BaseModel):
    age: float
    gender: str
    histology: Optional[str] = None
    overall_stage: Optional[str] = None
    t_stage: Optional[str] = None
    n_stage: Optional[str] = None
    m_stage: Optional[str] = None
    egfr_status: Optional[str] = None
    kras_status: Optional[str] = None
    alk_status: Optional[str] = None
    smoking_status: Optional[str] = None
    performance_status: Optional[int] = None


def _rule_based_recommendations(req: RecommendationRequest) -> list:
    """
    Experimental guideline-informed treatment candidates.
    
    IMPORTANT: These are experimental ranking suggestions based on documented
    NSCLC clinical guidelines, NOT validated ML recommendations. They do NOT
    constitute clinical advice and must not be used for real patient care.
    Rankings are illustrative only.
    """
    candidates = []
    stage = (req.overall_stage or "").upper()
    hist = (req.histology or "").lower()
    egfr = (req.egfr_status or "").lower()
    kras = (req.kras_status or "").lower()
    alk = (req.alk_status or "").lower()

    # Stage I/II — potential for surgical resection
    if stage in ["I", "IA", "IB", "II", "IIA", "IIB"]:
        candidates.append({
            "rank": 1,
            "option": "Surgical Resection (Lobectomy/Segmentectomy)",
            "category": "Surgery",
            "ranking_score": 0.92,
            "supporting_factors": ["Early-stage disease", "Potentially curative intent"],
            "limiting_factors": ["Performance status must be assessed", "Pulmonary function evaluation required"],
            "evidence_basis": "NSCLC clinical guidelines for stage I/II disease",
        })
        candidates.append({
            "rank": 2,
            "option": "Adjuvant Chemotherapy (post-resection)",
            "category": "Chemotherapy",
            "ranking_score": 0.75,
            "supporting_factors": ["Node-positive disease may benefit", "Evidence from randomized trials"],
            "limiting_factors": ["Benefit limited in stage I", "Toxicity considerations"],
            "evidence_basis": "Adjuvant chemotherapy guidelines",
        })

    # Targeted therapy for EGFR mutant
    if "mutant" in egfr or "mutation" in egfr:
        candidates.insert(0, {
            "rank": 1,
            "option": "EGFR Tyrosine Kinase Inhibitor (e.g., Osimertinib)",
            "category": "Targeted Therapy",
            "ranking_score": 0.95,
            "supporting_factors": ["EGFR mutation detected", "First-line targeted therapy"],
            "limiting_factors": ["Resistance mechanisms may develop"],
            "evidence_basis": "EGFR TKI guidelines for EGFR-mutant NSCLC",
        })

    # ALK rearrangement
    if "rearrangement" in alk or "positive" in alk or "mutant" in alk:
        candidates.insert(0, {
            "rank": 1,
            "option": "ALK Inhibitor (e.g., Alectinib)",
            "category": "Targeted Therapy",
            "ranking_score": 0.95,
            "supporting_factors": ["ALK translocation detected", "First-line targeted therapy"],
            "limiting_factors": ["Resistance mechanisms may develop"],
            "evidence_basis": "ALK inhibitor guidelines",
        })

    # Advanced stage (IIIa/IIIb/IV)
    if stage in ["IIIA", "IIIB", "IV"]:
        candidates.append({
            "rank": len(candidates) + 1,
            "option": "Platinum-based Chemotherapy",
            "category": "Chemotherapy",
            "ranking_score": 0.70,
            "supporting_factors": ["Standard of care for advanced NSCLC without targetable mutations"],
            "limiting_factors": ["Toxicity profile", "Performance status must be adequate"],
            "evidence_basis": "First-line chemotherapy for advanced NSCLC",
        })
        candidates.append({
            "rank": len(candidates) + 1,
            "option": "Immunotherapy (PD-L1 Testing Recommended)",
            "category": "Immunotherapy",
            "ranking_score": 0.68,
            "supporting_factors": ["Potential benefit in PD-L1 high expressors"],
            "limiting_factors": ["PD-L1 status not assessed", "Autoimmune conditions contraindicated"],
            "evidence_basis": "Checkpoint inhibitor guidelines",
        })
        if stage == "IIIA" or stage == "IIIB":
            candidates.append({
                "rank": len(candidates) + 1,
                "option": "Concurrent Chemoradiation",
                "category": "Combined Therapy",
                "ranking_score": 0.72,
                "supporting_factors": ["Locally advanced disease", "Guideline-recommended for stage III"],
                "limiting_factors": ["Esophagitis, pneumonitis risk", "Performance status must be adequate"],
                "evidence_basis": "Chemoradiation for unresectable stage III NSCLC",
            })

    # Palliative radiation
    candidates.append({
        "rank": len(candidates) + 1,
        "option": "Palliative / Symptomatic Radiation Therapy",
        "category": "Radiation",
        "ranking_score": 0.45,
        "supporting_factors": ["Symptom control for bone metastases, brain metastases, or airway obstruction"],
        "limiting_factors": ["Not curative intent"],
        "evidence_basis": "Palliative radiation guidelines",
    })

    # Re-rank
    for i, c in enumerate(candidates):
        c["rank"] = i + 1

    return candidates


@router.post("")
def get_recommendations(req: RecommendationRequest):
    """
    Generate experimental treatment recommendations.
    
    These are guideline-informed experimental rankings, NOT validated ML predictions.
    The NSCLC Radiogenomics dataset does not have sufficient matched treatment-outcome
    pairs to train a validated ranking model. This feature is labelled EXPERIMENTAL.
    """
    candidates = _rule_based_recommendations(req)

    return {
        "status": "experimental",
        "disclaimer": (
            "EXPERIMENTAL: These ranking suggestions are derived from published NSCLC clinical "
            "guidelines and are NOT validated ML recommendations. They do not constitute clinical "
            "advice and must not be used for real patient care decisions. Always consult qualified "
            "medical professionals. Scores are experimental ranking weights, not treatment success probabilities."
        ),
        "data_limitation": (
            "The NSCLC Radiogenomics dataset (n=211) has insufficient matched treatment-outcome "
            "records to train a statistically validated treatment ranking model. "
            "A rule-based experimental prototype is provided instead."
        ),
        "patient_summary": {
            "age": req.age,
            "gender": req.gender,
            "histology": req.histology,
            "stage": req.overall_stage,
            "egfr_status": req.egfr_status,
            "kras_status": req.kras_status,
            "alk_status": req.alk_status,
        },
        "candidates": candidates,
        "missing_information": [
            k for k, v in {
                "Histology": req.histology,
                "EGFR Status": req.egfr_status,
                "KRAS Status": req.kras_status,
                "ALK Status": req.alk_status,
                "Performance Status": req.performance_status,
                "Cancer Stage": req.overall_stage,
            }.items() if not v
        ],
    }

