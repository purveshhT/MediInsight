import React from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell, CartesianGrid
} from 'recharts';
import { Pill, AlertCircle, Dna, Activity, ShieldAlert } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { getTreatmentAnalytics } from '../../services/api';
import { CHART_COLORS } from '../../utils/colors';

export function TreatmentAnalyticsPage() {
  const { data: treatment, loading } = useApi(getTreatmentAnalytics);

  if (loading) {
    return <div className="p-12 text-center text-sm text-slate-400">Loading treatment and biomarker analytics...</div>;
  }

  const {
    treatment_frequency, treatment_combinations, recurrence,
    recurrence_location, biomarkers, chemo_by_histology
  } = (treatment || {}) as any;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Treatment & Radiogenomics Analytics</h1>
        <p className="text-slate-500 text-sm mt-1">
          Analysis of systemic chemotherapy, radiation modalities, molecular biomarkers, and disease recurrence patterns.
        </p>
      </div>

      {/* Critical Causal Bias Disclaimer */}
      <div className="p-5 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3">
        <ShieldAlert className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 space-y-1">
          <strong className="text-sm font-bold block text-amber-950 uppercase tracking-wide">
            Confounding by Indication & Observational Selection Bias
          </strong>
          <p>
            In non-randomized observational cohorts such as NSCLC Radiogenomics (n=211), treatments were prescribed based on clinical severity,
            comorbidities, and surgical operability. Patients receiving adjuvant chemotherapy typically presented with more aggressive histology or advanced staging.
            <strong> Observational survival discrepancies must NEVER be interpreted as comparative treatment efficacy.</strong>
          </p>
        </div>
      </div>

      {/* Treatment Modality Frequencies */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-800 mb-1">Chemotherapy Administration</h2>
          <p className="text-xs text-slate-400 mb-4">Adjuvant & Neoadjuvant Systemic Therapy</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={treatment_frequency?.chemotherapy || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="treatment" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" fill="#0284c7" radius={[4, 4, 0, 0]} name="Patients" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-800 mb-1">Radiation Therapy</h2>
          <p className="text-xs text-slate-400 mb-4">Definitive, Adjuvant or Palliative</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={treatment_frequency?.radiation || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="treatment" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Patients" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-800 mb-1">Disease Recurrence</h2>
          <p className="text-xs text-slate-400 mb-4">Post-resection follow-up surveillance</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={recurrence || []}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  label={({ payload }: any) => `${payload.status}: ${payload.count}`}
                >
                  <Cell fill="#f43f5e" />
                  <Cell fill="#10b981" />
                  <Cell fill="#cbd5e1" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Molecular Biomarkers Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <Dna className="w-5 h-5 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-800">Targetable Molecular Biomarkers (Radiogenomics Panel)</h2>
        </div>
        <p className="text-xs text-slate-400 mb-6">EGFR, KRAS, and ALK mutation status across NSCLC cases</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-700 uppercase mb-2">EGFR Status</h3>
            <div className="space-y-1.5 text-xs">
              {biomarkers?.egfr?.map((b: any) => (
                <div key={b.status} className="flex justify-between items-center py-1 border-b border-slate-200 last:border-0">
                  <span className="text-slate-600">{b.status}</span>
                  <span className="font-bold text-slate-900 font-mono">{b.count} ({((b.count / 211) * 100).toFixed(1)}%)</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-700 uppercase mb-2">KRAS Status</h3>
            <div className="space-y-1.5 text-xs">
              {biomarkers?.kras?.map((b: any) => (
                <div key={b.status} className="flex justify-between items-center py-1 border-b border-slate-200 last:border-0">
                  <span className="text-slate-600">{b.status}</span>
                  <span className="font-bold text-slate-900 font-mono">{b.count} ({((b.count / 211) * 100).toFixed(1)}%)</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-700 uppercase mb-2">ALK Translocation</h3>
            <div className="space-y-1.5 text-xs">
              {biomarkers?.alk?.map((b: any) => (
                <div key={b.status} className="flex justify-between items-center py-1 border-b border-slate-200 last:border-0">
                  <span className="text-slate-600">{b.status}</span>
                  <span className="font-bold text-slate-900 font-mono">{b.count} ({((b.count / 211) * 100).toFixed(1)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
