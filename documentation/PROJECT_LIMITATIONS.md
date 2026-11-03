# MediInsight AI: Academic Limitations & Clinical Safety Protocol

## 1. Academic & Scientific Limitations

In accordance with strict academic research ethics and Part 22 of the project specifications, the following scientific boundaries are explicitly documented:

### 1.1 Lack of Paired Multimodal Data
* The 1,633 3D CT volumes in `NoduleMNIST3D` are sourced from the LIDC-IDRI study and are **unpaired** with the 422 patients in `NSCLC-Radiomics` or the 211 patients in `NSCLC Radiogenomics`.
* In the absence of patient-level linkage, **joint multimodal feature fusion is not mathematically permissible**. The system transparently operates separate domain modules rather than fabricating synthetic associations.

### 1.2 Retrospective Observational Staging & Causal Bias
* Treatments recorded in `NSCLC Radiogenomics` (such as chemotherapy and radiation) were administered based on non-randomized clinical indications.
* Patients with more aggressive disease or higher staging were systematically more likely to receive adjuvant regimens. Consequently, observed differences in survival time across treatment groups reflect **confounding by indication**, not randomized clinical efficacy.

### 1.3 Resolution Constraints of NoduleMNIST3D
* MedMNIST volumes are preprocessed into low-resolution $28 \times 28 \times 28$ matrices for rapid machine learning benchmarking.
* They lack diagnostic fine-slice DICOM detail, windowing parameters, and radiologist annotations. Model predictions are strictly experimental classifications, not clinical radiology diagnoses.

### 1.4 Guideline-Informed Decision Support Prototype
* Because the retrospective clinical cohorts contain insufficient counterfactual outcome labels, machine learning LambdaMART ranking cannot be trained without risk of learning institutional prescribing bias.
* Treatment recommendations are thus presented as an **experimental decision-support prototype** using documented clinical practice guidelines. Scores indicate ranking weights, not survival probabilities.

---

## 2. Regulatory Medical Device Disclaimer

> **CLINICAL NOTICE:** MediInsight AI is an educational software application developed for academic evaluation. It is NOT certified as a medical device by any healthcare authority.
>
> It must never be used to replace clinical judgment, provide definitive medical diagnoses, or independently prescribe patient treatment. Always consult certified oncology multidisciplinary teams.

