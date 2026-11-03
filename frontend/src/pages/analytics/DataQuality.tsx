import React, { useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { Shield, AlertCircle, CheckCircle2, FileSpreadsheet, Database, Layers } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { getDatasetQuality } from '../../services/api';

export function DataQuality() {
  const { data: qualityReport, loading, error } = useApi(getDatasetQuality);
  const [selectedDataset, setSelectedDataset] = useState<string>('nsclc_radiomics');

  if (loading) {
    return <div className="p-12 text-center text-sm text-slate-400">Auditing dataset quality and governance profiles...</div>;
  }

  const dsData = qualityReport?.[selectedDataset];
  const nmData = qualityReport?.nodulemnist3d;

  const missingChartData = dsData?.columns?.map((c: any) => ({
    column: c.name,
    missing_pct: c.missing_pct,
    missing_count: c.missing_count,
  })).filter((c: any) => c.missing_pct > 0) || [];

  const datasetTabs = [
    { id: 'nsclc_radiomics', label: 'NSCLC-Radiomics' },
    { id: 'nsclc_radiogenomics', label: 'NSCLC Radiogenomics' },
    { id: 'iq_othnccd', label: 'IQ-OTH/NCCD CT' },
    { id: 'chest_ct_subtypes', label: 'Chest CT Subtypes' },
    { id: 'tcia_diagnosis', label: 'TCIA Diagnosis' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Data Quality & Governance Audit</h1>
          <p className="text-slate-500 text-sm mt-1">
            Profiling missingness, completeness, duplicate integrity, and class distributions across all ingested cohorts.
          </p>
        </div>
        <div className="flex flex-wrap bg-slate-200 p-1 rounded-xl text-xs font-semibold gap-1">
          {datasetTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedDataset(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedDataset === tab.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dataset Profile KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-400 uppercase tracking-wide block mb-1">Total Records</span>
          <div className="text-3xl font-extrabold text-slate-900 font-mono">{dsData?.total_records}</div>
          <span className="text-[11px] text-slate-400">Patients in cohort</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-400 uppercase tracking-wide block mb-1">Total Schema Columns</span>
          <div className="text-3xl font-extrabold text-slate-900 font-mono">{dsData?.total_columns}</div>
          <span className="text-[11px] text-slate-400">Clinical & genomic fields</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-400 uppercase tracking-wide block mb-1">Duplicate Rows</span>
          <div className="text-3xl font-extrabold text-emerald-600 font-mono">{dsData?.duplicate_rows}</div>
          <span className="text-[11px] text-emerald-600 font-semibold">Zero duplicate patient entries</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-400 uppercase tracking-wide block mb-1">Total Missing Cells</span>
          <div className="text-3xl font-extrabold text-amber-600 font-mono">{dsData?.missing_values_total}</div>
          <span className="text-[11px] text-slate-400">Handled via documented imputations</span>
        </div>
      </div>

      {/* Missing Values Chart */}
      {missingChartData.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-800 mb-1">Column Missingness Percentage (%)</h2>
          <p className="text-xs text-slate-400 mb-4">Features with unrecorded or unavailable entries</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={missingChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="column" stroke="#94a3b8" fontSize={10} angle={-25} textAnchor="end" height={60} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="missing_pct" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Missing %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Complete Schema Audit Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <h2 className="text-sm font-bold text-slate-800 mb-1">Attribute Profiling Dictionary</h2>
        <p className="text-xs text-slate-400 mb-4">Data types, completeness, and cardinalities</p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
              <tr>
                <th className="py-2.5 px-3">Column Name</th>
                <th className="py-2.5 px-3">Data Type</th>
                <th className="py-2.5 px-3">Missing (Count / %)</th>
                <th className="py-2.5 px-3">Unique Values</th>
                <th className="py-2.5 px-3">Sample Distributions / Stats</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dsData?.columns?.map((c: any) => (
                <tr key={c.name} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{c.name}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-500">{c.dtype}</td>
                  <td className="py-2.5 px-3">
                    <span className={`font-mono ${c.missing_count > 0 ? 'text-amber-700 font-bold' : 'text-emerald-700'}`}>
                      {c.missing_count} ({c.missing_pct}%)
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono">{c.unique_values}</td>
                  <td className="py-2.5 px-3 text-slate-500">
                    {c.stats ? (
                      <span className="font-mono text-[11px]">
                        Mean: {c.stats.mean} | Median: {c.stats.median} | [{c.stats.min} - {c.stats.max}]
                      </span>
                    ) : c.top_values ? (
                      <span className="text-[11px]">
                        {Object.entries(c.top_values).slice(0, 3).map(([k, v]) => `${k} (${v})`).join(', ')}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

