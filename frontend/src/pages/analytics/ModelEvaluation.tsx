import React, { useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { BarChart3, RefreshCw, CheckCircle, AlertTriangle, Layers, Cpu, Database } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { getModelEvaluation, trainModel } from '../../services/api';

export function ModelEvaluation() {
  const { data: evalWrapper, loading, error } = useApi(getModelEvaluation);
  const [retraining, setRetraining] = useState(false);
  const [retrainMsg, setRetrainMsg] = useState<string | null>(null);

  const evalData = evalWrapper?.nodule_classifier;

  const handleRetrain = async () => {
    setRetraining(true);
    setRetrainMsg(null);
    try {
      const res = await trainModel('nodule_classifier');
      setRetrainMsg(`Model retrained successfully. Test AUC: ${res.data.results.test_metrics.roc_auc}`);
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setRetrainMsg(`Retraining failed: ${err.message}`);
    } finally {
      setRetraining(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-sm text-slate-400">Loading model evaluation reports...</div>;
  }

  const {
    model, approach, training_samples, val_samples, test_samples,
    test_metrics, feature_importance
  } = (evalData || {}) as any;

  const classReport = test_metrics?.classification_report || {};

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Machine Learning Model Evaluation</h1>
          <p className="text-slate-500 text-sm mt-1">
            Standardized evaluation of 3D CT Nodule Classifier across predefined train, val, and test splits.
          </p>
        </div>
        <button
          onClick={handleRetrain}
          disabled={retraining}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${retraining ? 'animate-spin' : ''}`} />
          {retraining ? 'Retraining on CPU...' : 'Retrain Model'}
        </button>
      </div>

      {retrainMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {retrainMsg}
        </div>
      )}

      {/* Model Architecture Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-400 uppercase tracking-wide block mb-1">Architecture</span>
          <div className="text-base font-bold text-slate-900">{model || 'Random Forest'}</div>
          <span className="text-[11px] text-slate-500">100 Estimators, Class Weighted</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-400 uppercase tracking-wide block mb-1">Predefined Split Volumes</span>
          <div className="text-base font-bold text-slate-900 font-mono">1,158 / 165 / 310</div>
          <span className="text-[11px] text-slate-500">Train / Val / Test Sets</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-400 uppercase tracking-wide block mb-1">Hardware Optimization</span>
          <div className="text-base font-bold text-slate-900">CPU Compatible</div>
          <span className="text-[11px] text-emerald-600 font-semibold">Sub-20s Execution</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-400 uppercase tracking-wide block mb-1">Primary Objective</span>
          <div className="text-base font-bold text-slate-900">Binary Classification</div>
          <span className="text-[11px] text-slate-500">Benign vs Malignant</span>
        </div>
      </div>

      {/* Detailed Classification Report Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <h2 className="text-sm font-bold text-slate-800 mb-1">Held-Out Test Set Classification Report (n=310)</h2>
        <p className="text-xs text-slate-400 mb-4">Per-class precision, recall, and F1-score with class support counts</p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
              <tr>
                <th className="py-2.5 px-3">Class Label</th>
                <th className="py-2.5 px-3">Precision</th>
                <th className="py-2.5 px-3">Recall (Sensitivity)</th>
                <th className="py-2.5 px-3">F1-Score</th>
                <th className="py-2.5 px-3 font-mono">Support (n)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {['Benign', 'Malignant'].map(cl => {
                const row = classReport[cl];
                if (!row) return null;
                return (
                  <tr key={cl} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{cl}</td>
                    <td className="py-2.5 px-3 font-mono">{(row.precision * 100).toFixed(1)}%</td>
                    <td className="py-2.5 px-3 font-mono">{(row.recall * 100).toFixed(1)}%</td>
                    <td className="py-2.5 px-3 font-mono">{(row['f1-score'] * 100).toFixed(1)}%</td>
                    <td className="py-2.5 px-3 font-mono font-bold">{row.support}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature Importance Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <h2 className="text-sm font-bold text-slate-800 mb-1">Complete Feature Importance Ranking</h2>
        <p className="text-xs text-slate-400 mb-4">All 20 volumetric features ranked by decision forest split contribution</p>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={feature_importance || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" stroke="#94a3b8" fontSize={10} />
              <YAxis dataKey="feature" type="category" width={130} stroke="#94a3b8" fontSize={10} />
              <Tooltip />
              <Bar dataKey="importance" fill="#0284c7" radius={[0, 4, 4, 0]} name="Importance" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

