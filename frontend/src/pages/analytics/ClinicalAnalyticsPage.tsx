import React from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  LineChart, Line, CartesianGrid
} from 'recharts';
import { AlertCircle, Activity, Info } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { getClinicalAnalytics, getSurvivalAnalytics } from '../../services/api';
import { CHART_COLORS } from '../../utils/colors';

export function ClinicalAnalyticsPage() {
  const { data: clinical, loading: loadClin } = useApi(getClinicalAnalytics);
  const { data: survival, loading: loadSurv } = useApi(getSurvivalAnalytics);

  if (loadClin || loadSurv) {
    return <div className="p-12 text-center text-sm text-slate-400">Loading clinical analytics and survival curves...</div>;
  }

  const {
    age_by_stage, t_stage_distribution, n_stage_distribution,
    m_stage_distribution, overall_stage_distribution,
    correlation_matrix
  } = clinical as any;

  // Transform age by stage for display
  const stageBoxData = Object.entries(age_by_stage || {}).map(([stage, stats]: any) => ({
    stage,
    min: stats.min,
    median: stats.median,
    max: stats.max,
    mean: stats.mean,
    q1: stats.q1,
    q3: stats.q3,
    count: stats.count,
  }));

  // Kaplan-Meier curves data
  const kmByStage = survival?.by_stage || {};

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clinical & Survival Analytics</h1>
        <p className="text-slate-500 text-sm mt-1">
          Bivariate clinical relationships, TNM staging distributions, correlation matrices, and Kaplan-Meier survival curves.
        </p>
      </div>

      {/* Caution Note */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-900 leading-relaxed">
          <strong>Statistical Governance Reminder:</strong> Observational clinical correlations must not be interpreted as causal relationships.
          Differences in survival curves by stage reflect disease biology and presentation, not randomized therapeutic interventions.
        </p>
      </div>

      {/* TNM Stage Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-800 mb-1">T-Stage (Tumor Extent)</h2>
          <p className="text-xs text-slate-400 mb-3">T1: ≤3cm | T2: 3-5cm | T3: 5-7cm | T4: &gt;7cm</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={t_stage_distribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="stage" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" fill="#0891b2" radius={[4, 4, 0, 0]} name="Patients" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-800 mb-1">N-Stage (Nodal Involvement)</h2>
          <p className="text-xs text-slate-400 mb-3">N0: None | N1: Hilar | N2: Mediastinal | N3: Contralateral</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={n_stage_distribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="stage" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Patients" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-800 mb-1">M-Stage (Metastasis)</h2>
          <p className="text-xs text-slate-400 mb-3">M0: No distant metastasis | M1: Distant metastasis</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={m_stage_distribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="stage" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" fill="#0284c7" radius={[4, 4, 0, 0]} name="Patients" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Age by Stage Summary Table & Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-800 mb-1">Patient Age by Cancer Stage (Summary Statistics)</h2>
          <p className="text-xs text-slate-400 mb-4">Five-number summary across staging cohorts</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                <tr>
                  <th className="py-2.5 px-3">Stage</th>
                  <th className="py-2.5 px-3">Patients</th>
                  <th className="py-2.5 px-3">Min</th>
                  <th className="py-2.5 px-3">Median</th>
                  <th className="py-2.5 px-3">Mean</th>
                  <th className="py-2.5 px-3">Max</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stageBoxData.map(s => (
                  <tr key={s.stage} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-blue-700">{s.stage}</td>
                    <td className="py-2.5 px-3 font-mono">{s.count}</td>
                    <td className="py-2.5 px-3 font-mono">{s.min}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{s.median}</td>
                    <td className="py-2.5 px-3 font-mono">{s.mean}</td>
                    <td className="py-2.5 px-3 font-mono">{s.max}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Correlation Matrix */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-800 mb-1">Clinical Feature Correlation Matrix (Pearson)</h2>
          <p className="text-xs text-slate-400 mb-4">Pairwise linear correlation across numerical clinical variables</p>
          {correlation_matrix && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-3 text-left">Feature</th>
                    {correlation_matrix.columns.map((c: string) => (
                      <th key={c} className="py-2 px-3 font-semibold text-slate-600">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {correlation_matrix.columns.map((rowName: string, rIdx: number) => (
                    <tr key={rowName}>
                      <td className="py-2.5 px-3 text-left font-medium text-slate-800">{rowName}</td>
                      {correlation_matrix.matrix[rIdx].map((val: number, cIdx: number) => {
                        const intensity = Math.abs(val);
                        const isPos = val >= 0;
                        return (
                          <td
                            key={cIdx}
                            className="py-2.5 px-3 font-mono font-bold"
                            style={{
                              backgroundColor: isPos ? `rgba(14, 165, 233, ${intensity * 0.4})` : `rgba(244, 63, 94, ${intensity * 0.4})`,
                              color: intensity > 0.5 ? '#0f172a' : '#475569',
                            }}
                          >
                            {val.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Kaplan-Meier Survival Analysis */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Kaplan-Meier Survival Estimation Stratified by Cancer Stage</h2>
            <p className="text-xs text-slate-400">Timeline (days) vs Estimated Survival Probability P(S(t))</p>
          </div>
          <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md font-medium">lifelines v0.30</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          {Object.entries(kmByStage).map(([stage, item]: any) => (
            <div key={stage} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-sm text-slate-900">Stage {stage}</span>
                <span className="text-xs text-slate-500 font-mono">n={item.n}</span>
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                <div>Median Survival: <strong className="text-slate-900">{item.km.median_survival ? `${item.km.median_survival.toFixed(0)} days` : 'Not reached'}</strong></div>
                <div>Observed Deaths: <strong className="text-slate-900">{item.km.n_events}</strong></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

