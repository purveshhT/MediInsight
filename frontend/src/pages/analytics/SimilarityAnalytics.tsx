import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { GitCompare, Search, AlertCircle, Database, Layers } from 'lucide-react';
import { getSimilarCases } from '../../services/api';

export function SimilarityAnalytics() {
  const [params, setParams] = useState({
    age: 68,
    gender: 'male',
    histology: 'squamous cell carcinoma',
    t_stage: '2',
    n_stage: '1',
    m_stage: '0',
    n_neighbors: 8,
  });

  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getSimilarCases(params)
      .then(res => setResults(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const chartData = results?.similar_cases?.map((c: any) => ({
    patient: c.patient_id,
    similarity: (c.similarity_score * 100).toFixed(1),
    distance: c.distance,
  })) || [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Case Similarity & Retrieval Analytics</h1>
        <p className="text-slate-500 text-sm mt-1">
          Nearest-neighbor vector search in standardized clinical staging space (k=8 nearest cases across NSCLC-Radiomics).
        </p>
      </div>

      <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
        <p className="text-xs text-sky-900 leading-relaxed">
          <strong>Retrieval Methodology:</strong> Feature vectors comprise normalized age, T-stage, N-stage, M-stage, gender, and histology categories.
          The retrieval score is computed via <code className="bg-sky-100 px-1 py-0.5 rounded font-mono">1 / (1 + EuclideanDistance)</code>.
          Similarity scores evaluate clinical feature proximity, not disease prognosis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Similarity Ranking Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-800 mb-1">Top Retrieved Patient Similarity Scores (%)</h2>
          <p className="text-xs text-slate-400 mb-4">Ranked feature proximity to synthetic query</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="patient" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="similarity" fill="#0891b2" radius={[4, 4, 0, 0]} name="Similarity %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feature Proximity Table */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-800 mb-1">Retrieved Cohort Summary</h2>
          <p className="text-xs text-slate-400 mb-4">Nearest neighbors in 6-dimensional clinical space</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                <tr>
                  <th className="py-2 px-3">Patient ID</th>
                  <th className="py-2 px-3">Histology</th>
                  <th className="py-2 px-3">Stage</th>
                  <th className="py-2 px-3">Survival</th>
                  <th className="py-2 px-3 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results?.similar_cases?.map((c: any) => (
                  <tr key={c.rank} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono font-bold text-blue-700">{c.patient_id}</td>
                    <td className="py-2 px-3 capitalize">{c.histology}</td>
                    <td className="py-2 px-3 font-semibold">{c.overall_stage || `T${c.t_stage}N${c.n_stage}`}</td>
                    <td className="py-2 px-3 font-mono">{c.survival_time ? `${c.survival_time.toFixed(0)} d` : 'N/A'}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      {(c.similarity_score * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

