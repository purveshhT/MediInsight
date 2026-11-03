import React, { useState, useEffect } from 'react';
import {
  Users, Scan, Database, Calendar, Filter, Sparkles, RefreshCw, AlertCircle, CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell, CartesianGrid
} from 'recharts';
import { getAnalyticsOverview } from '../../services/api';
import { CHART_COLORS } from '../../utils/colors';

const SOURCES = [
  { id: 'all', label: 'All Datasets (Aggregate Overview - 6 Cohorts)', desc: 'Combined view of clinical cohorts, research scans, and local records' },
  { id: 'new_assessments', label: 'Newly Created Assessments (SQLite)', desc: 'Live synchronizing database of doctor-created assessments', badge: 'Live Sync' },
  { id: 'iq_othnccd', label: 'IQ-OTH/NCCD Lung Cancer CT (n=1,294)', desc: 'Full-resolution 512×512 Siemens SOMATOM scans (Normal, Benign, Malignant)' },
  { id: 'chest_ct_subtypes', label: 'Chest CT Cancer Subtypes (n=1,000)', desc: 'Multiclass Adenocarcinoma, Squamous Cell, Large Cell, and Normal with TNM staging' },
  { id: 'nsclc_radiomics', label: 'NSCLC-Radiomics Cohort (n=422)', desc: 'Baseline CT features, clinical staging, and survival data' },
  { id: 'nsclc_radiogenomics', label: 'NSCLC Radiogenomics Cohort (n=211)', desc: 'Molecular biomarker, histology, and treatment records' },
  { id: 'nodulemnist3d', label: 'NoduleMNIST3D Cohort (n=1,633)', desc: '3D CT volumetric binary benign/malignant benchmark' },
];

export function HealthcareOverview() {
  const [selectedSource, setSelectedSource] = useState('all');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (src: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAnalyticsOverview(src);
      setData(res.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedSource);
  }, [selectedSource]);

  useEffect(() => {
    const handler = () => fetchData(selectedSource);
    window.addEventListener('mediinsight-refresh', handler);
    return () => window.removeEventListener('mediinsight-refresh', handler);
  }, [selectedSource]);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-cyan-600" />
        <span className="text-sm font-medium">Synchronizing healthcare population overview...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Error loading overview: {error}</span>
        </div>
      </div>
    );
  }

  const { kpis, cancer_stage, gender, age, histology, dataset_comparison } = data;
  const currentSourceMeta = SOURCES.find(s => s.id === selectedSource) || SOURCES[0];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Healthcare Population Overview</h1>
            <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 text-[11px] font-semibold rounded-full border border-cyan-200">
              Multimodal Cohorts
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Demographic, clinical staging, and multimodal dataset composition across four independent cohorts.
          </p>
        </div>

        {/* Cohort Filter Selector */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs">
          <Filter className="w-4 h-4 text-slate-400 ml-2" />
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="text-xs font-semibold text-slate-700 bg-transparent pr-4 py-1 focus:outline-hidden cursor-pointer"
          >
            {SOURCES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          {selectedSource === 'new_assessments' && (
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md animate-pulse">
              LIVE
            </span>
          )}
        </div>
      </div>

      {/* Cohort Meta Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
          <span>
            <strong className="text-slate-800">Active Population Filter:</strong> {currentSourceMeta.desc}
          </span>
        </div>
        {selectedSource === 'new_assessments' && (
          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Dynamically updated on every Doctor intake
          </span>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Clinical Records</span>
            <Users className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{kpis.total_clinical_records}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {selectedSource === 'new_assessments' ? 'Persisted in SQLite database' : 'Independent patient records'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Imaging Scans</span>
            <Scan className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{kpis.total_imaging_samples}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {selectedSource === 'new_assessments' ? 'User-uploaded CT/DICOM scans' : 'NoduleMNIST3D 28×28×28'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Mean Patient Age</span>
            <Calendar className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {kpis.avg_patient_age} <span className="text-sm font-medium text-slate-500">yrs</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Active filter distribution</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Target Cohorts</span>
            <Database className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{kpis.total_datasets}</div>
          <div className="text-[11px] text-slate-400 mt-1">Strict governance boundaries</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cancer Stage Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-bold text-slate-800">Cancer Stage Distribution</h2>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">AJCC Stage</span>
          </div>
          <p className="text-xs text-slate-400 mb-4">Source: {cancer_stage?.source || 'Cohort distribution'}</p>
          <div className="h-64">
            {cancer_stage?.chart_data?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={cancer_stage.chart_data}
                    dataKey="count"
                    nameKey="stage"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    label={({ payload }: any) => `${payload.stage}: ${payload.percentage ?? payload.count}%`}
                  >
                    {cancer_stage.chart_data.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${value} patients`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No stage data available for this filter
              </div>
            )}
          </div>
        </div>

        {/* Gender Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-bold text-slate-800">Gender Distribution</h2>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">Demographics</span>
          </div>
          <p className="text-xs text-slate-400 mb-4">Source: {gender?.source || 'Demographics distribution'}</p>
          <div className="h-64">
            {gender?.chart_data?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gender.chart_data}
                    dataKey="count"
                    nameKey="gender"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ payload }: any) => `${payload.gender}: ${payload.count}`}
                  >
                    <Cell fill="#0891b2" />
                    <Cell fill="#f43f5e" />
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${value} patients`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No gender data recorded for this filter
              </div>
            )}
          </div>
        </div>

        {/* Age Histogram */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-bold text-slate-800">Age Distribution by Decade</h2>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">Age Profile</span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Mean: {age?.mean_age ?? 0} yrs | Range: {age?.min_age ?? 0} - {age?.max_age ?? 0} yrs
          </p>
          <div className="h-64">
            {age?.histogram?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={age.histogram}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="age_group" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0f4c81" radius={[4, 4, 0, 0]} name="Patient Count" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No age distribution data
              </div>
            )}
          </div>
        </div>

        {/* Histology Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-bold text-slate-800">Histological Subtypes</h2>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">Pathology</span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Source: {histology?.nsclc_radiomics?.source || 'Histology distribution'}
          </p>
          <div className="h-64">
            {histology?.nsclc_radiomics?.chart_data?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histology.nsclc_radiomics.chart_data} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                  <YAxis dataKey="histology" type="category" width={110} stroke="#94a3b8" fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#06b6d4" radius={[0, 4, 4, 0]} name="Patients" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No histology data recorded
              </div>
            )}
          </div>
        </div>

        {/* Dataset Size & Modality Comparison */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs md:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-bold text-slate-800">Cross-Dataset Sample Volume & Modality Comparison</h2>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-medium">
              Multimodal Ingestion
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4">Independent cohorts ingested into the MediInsight ecosystem</p>
          <div className="h-64">
            {dataset_comparison?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataset_comparison}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="dataset" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="records" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Records / Samples" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No comparison records
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
