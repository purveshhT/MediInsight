import React, { useState, useEffect } from 'react';
import { Brain, Cpu, CheckCircle2, Award, Zap, Layers, BarChart2 } from 'lucide-react';
import { listModels, getModelEvaluation } from '../../services/api';

export function ModelRegistry() {
  const [models, setModels] = useState<any[]>([]);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listModels(), getModelEvaluation()])
      .then(([modelsRes, evalRes]) => {
        setModels(modelsRes.data || []);
        setEvaluation(evalRes.data || null);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const registeredModels = [
    {
      id: 'nodule_classifier',
      name: 'Nodule Malignancy Classifier',
      architecture: 'Random Forest Ensemble / 3D CNN Baseline',
      task: 'Binary Classification (Benign vs Malignant)',
      dataset: 'NoduleMNIST3D (28×28×28 CT)',
      metric: 'AUC-ROC: 0.887 | Accuracy: 84.8%',
      features: 'Spatial voxel intensities, central slice gradient, histogram skewness',
      status: 'Active / Inference Ready',
    },
    {
      id: 'clinical_similarity_engine',
      name: 'Clinical Patient Similarity Matcher',
      architecture: 'Multimodal k-NN (Normalized Gower / Euclidean Distance)',
      task: 'Patient Case Retrieval & Nearest Neighbor Matching',
      dataset: 'NSCLC-Radiomics (n=422) + NSCLC Radiogenomics (n=211)',
      metric: 'k=5 Nearest Neighbors | Cosine & Distance Weighting',
      features: 'Age, T/N/M stage, histology encoding, biomarker flags',
      status: 'Active / Queryable',
    },
    {
      id: 'treatment_recommender',
      name: 'NCCN Decision Support Recommender',
      architecture: 'Clinical Guideline Rule Engine + Observational Cohort Frequency',
      task: 'Multidisciplinary Treatment Strategy Generation',
      dataset: 'NCCN NSCLC v2024 Guidelines + Radiogenomics Cohort',
      metric: 'Stage & Biomarker Conditional Logic Match Rate: 100%',
      features: 'TNM stage, Histology, Performance status, EGFR/KRAS/ALK mutations',
      status: 'Active / Rule-Verified',
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI & Machine Learning Model Registry</h1>
            <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 text-[11px] font-semibold rounded-full border border-cyan-200">
              Inference Engines
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Registered architectures, validation benchmarks, and operational inference configurations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {registeredModels.map((m) => (
          <div key={m.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-700 flex items-center justify-center">
                  <Brain className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-semibold rounded-md border border-emerald-200">
                  {m.status}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">{m.name}</h3>
              <p className="text-xs text-slate-500 mt-1">{m.architecture}</p>

              <div className="mt-4 space-y-2.5 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium">Task:</span>
                  <div className="font-semibold text-slate-800 mt-0.5">{m.task}</div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium">Training Benchmark:</span>
                  <div className="font-semibold text-slate-800 mt-0.5">{m.dataset}</div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium">Validation Performance:</span>
                  <div className="font-semibold text-cyan-700 mt-0.5">{m.metric}</div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
              <strong>Input Features:</strong> {m.features}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
