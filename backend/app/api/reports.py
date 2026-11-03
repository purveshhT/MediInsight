from fastapi import APIRouter, HTTPException
from app.models.nodule_classifier import train_nodule_classifier, get_model_evaluation
from app.services.similarity import get_similar_clinical_cases

router = APIRouter()


@router.get("/models")
def list_models():
    """List available models."""
    return {
        "models": [
            {
                "id": "nodule_classifier",
                "name": "Lung Nodule Classifier",
                "type": "Random Forest (hand-crafted features)",
                "dataset": "NoduleMNIST3D",
                "task": "Binary classification: Benign vs Malignant",
                "status": "available",
            },
            {
                "id": "clinical_retrieval",
                "name": "Clinical Case Retrieval",
                "type": "K-Nearest Neighbors",
                "dataset": "NSCLC-Radiomics (Lung1)",
                "task": "Similar patient case retrieval",
                "status": "available",
            },
            {
                "id": "treatment_ranking",
                "name": "Treatment Recommendation (Experimental)",
                "type": "Rule-based guideline prototype",
                "dataset": "NSCLC Radiogenomics + Published guidelines",
                "task": "Experimental treatment candidate ranking",
                "status": "experimental",
            }
        ]
    }


@router.post("/models/train")
def train_model(model_id: str = "nodule_classifier"):
    """Train a model."""
    if model_id == "nodule_classifier":
        result = train_nodule_classifier()
        return {"status": "success", "model_id": model_id, "results": result}
    raise HTTPException(status_code=404, detail=f"Model {model_id} not found or not trainable via API")


@router.get("/models/evaluation")
def model_evaluation():
    """Get model evaluation results."""
    return {
        "nodule_classifier": get_model_evaluation(),
        "disclaimer": "Evaluation performed on held-out test set from NoduleMNIST3D using predefined splits."
    }


@router.get("/similar-cases")
def similar_cases(
    age: float = 65.0,
    gender: str = "male",
    histology: str = "adenocarcinoma",
    t_stage: str = "2",
    n_stage: str = "1",
    m_stage: str = "0",
    n_neighbors: int = 5
):
    """Find similar clinical cases."""
    result = get_similar_clinical_cases(
        age=age, gender=gender, histology=histology,
        t_stage=t_stage, n_stage=n_stage, m_stage=m_stage,
        n_neighbors=n_neighbors
    )
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    return result

