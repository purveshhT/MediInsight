import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Database, Users, Scan, Clock, ArrowUpRight, Activity,
  CheckCircle2, AlertCircle, RefreshCw, BarChart2, ShieldCheck, FileImage
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell, CartesianGrid
} from 'recharts';
import { getNewAssessmentsOverview } from '../../services/api';
import { CHART_COLORS } from '../../utils/colors';

export function NewAssessmentAnalytics() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getNewAssessmentsOverview();
      setData(res.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load assessment analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    const handleRefresh = () => fetchOverview();
    window.addEventListener('mediinsight-refresh', handleRefresh);
    return () => window.removeEventListener('mediinsight-refresh', handleRefresh);
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-cyan-600" />
        <span className="text-sm font-medium">Computing real-time intake analytics from SQLite database...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Error loading assessment analytics: {error}</span>
        </div>
      </div>
    );
  }

  const {
    total_assessments,
    avg_age,
    age_range,
    stage_distribution,
    gender_distribution,
    histology_distribution,
    biomarkers,
    image_upload_stats,
    latest_assessment,
    activity_timeline,
  } = data;

  // Format biomarker data for comparison chart
  const biomarkerChartData = [
    {
      gene: 'EGFR',
      Positive: biomarkers?.egfr?.Positive || 0,
      Negative: biomarkers?.egfr?.Negative || 0,
      Unknown: (biomarkers?.egfr?.Unknown || 0) + (biomarkers?.egfr?.['Not Tested'] || 0),
    },
    {
      gene: 'KRAS',
      Positive: biomarkers?.kras?.Positive || 0,
      Negative: biomarkers?.kras?.Negative || 0,
      Unknown: (biomarkers?.kras?.Unknown || 0) + (biomarkers?.kras?.['Not Tested'] || 0),
    },
    {
      gene: 'ALK',
      Positive: biomarkers?.alk?.Positive || 0,
      Negative: biomarkers?.alk?.Negative || 0,
      Unknown: (biomarkers?.alk?.Unknown || 0) + (biomarkers?.alk?.['Not Tested'] || 0),
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                New Assessment Analytics
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span>Doctor Workspace Dynamic Intake Sync</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live SQLite Persistence
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchOverview()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Latest</span>
          </button>
          <button
            onClick={() => navigate('/doctor/assessment')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <span>+ New Intake</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-800/80 border border-blue-700/60 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5 text-cyan-300" />
          </div>
          <div>
            <div className="text-xs text-blue-200 uppercase tracking-wider font-semibold">
              Live Patient Synchronization Stream
            </div>
            <div className="text-sm font-medium text-white flex items-center gap-2 mt-0.5">
              <span>Latest Assessment: <strong>{latest_assessment?.id || 'DEMO-0003'}</strong></span>
              <span>•</span>
              <span className="text-blue-300 text-xs">
                {latest_assessment?.created_at ? new Date(latest_assessment.created_at).toLocaleString() : 'Just now'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs bg-blue-950/70 border border-blue-800/80 px-3 py-1.5 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-300">Isolated Local Cohort (Zero Bleed into Research Benchmarks)</span>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Assessments</span>
            <Users className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{total_assessments}</div>
          <div className="text-[11px] text-slate-400 mt-1">Submitted in Doctor Workspace</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Mean Patient Age</span>
            <Activity className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {avg_age} <span className="text-sm font-medium text-slate-500">yrs</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Range: {age_range?.min ?? 0} - {age_range?.max ?? 0} yrs
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Uploaded Images</span>
            <Scan className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {image_upload_stats?.total_images ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {image_upload_stats?.upload_rate_pct ?? 0}% patient scan attachment rate
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Top Subtype</span>
            <BarChart2 className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 truncate">
            {histology_distribution?.[0]?.histology || 'Adenocarcinoma'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {histology_distribution?.[0]?.count ?? 0} recorded patients
          </div>
        </div>
      </div>

      {/* Grid of Analytical Distributions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stage Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-800 mb-1">Stage Distribution (Newly Entered)</h2>
          <p className="text-xs text-slate-400 mb-4">Breakdown of AJCC overall clinical stages</p>
          <div className="h-64">
            {stage_distribution?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stage_distribution}
                    dataKey="count"
                    nameKey="stage"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    label={({ payload }: any) => `Stage ${payload.stage}: ${payload.count}`}
                  >
                    {stage_distribution.map((_: any, idx: number) => (
                      <Cell key={`cell-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No stage entries yet
              </div>
            )}
          </div>
        </div>

        {/* Histology Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-800 mb-1">Histological Subtypes</h2>
          <p className="text-xs text-slate-400 mb-4">Pathological classification among entered cases</p>
          <div className="h-64">
            {histology_distribution?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histology_distribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                  <YAxis dataKey="histology" type="category" width={110} stroke="#94a3b8" fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0284c7" radius={[0, 4, 4, 0]} name="Patients" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No histology data recorded
              </div>
            )}
          </div>
        </div>

        {/* Molecular Biomarker Status Rates */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-800 mb-1">Targetable Biomarker Positivity Rates</h2>
          <p className="text-xs text-slate-400 mb-4">EGFR, KRAS, and ALK mutation distributions</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={biomarkerChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="gene" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Positive" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Negative" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Unknown" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Medical Image Upload Analytics */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-bold text-slate-800">Medical Imaging Upload Pipeline</h2>
            <FileImage className="w-4 h-4 text-cyan-600" />
          </div>
          <p className="text-xs text-slate-400 mb-4">Scan formats, modalities, and storage metrics</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-xs font-semibold text-slate-600">Scan Formats</span>
              <div className="mt-2 space-y-1.5">
                {image_upload_stats?.format_breakdown?.length ? (
                  image_upload_stats.format_breakdown.map((item: any) => (
                    <div key={item.format} className="flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-700 font-semibold">{item.format}</span>
                      <span className="text-slate-500 font-medium">{item.count} files</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400">PNG, JPG, DICOM, NIfTI ready</div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-xs font-semibold text-slate-600">Modality Breakdown</span>
              <div className="mt-2 space-y-1.5">
                {image_upload_stats?.type_breakdown?.length ? (
                  image_upload_stats.type_breakdown.map((item: any) => (
                    <div key={item.type} className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 font-semibold">{item.type}</span>
                      <span className="text-slate-500 font-medium">{item.count}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400">CT volumetric scans</div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-cyan-50/70 border border-cyan-100 rounded-xl flex items-center justify-between text-xs text-cyan-900">
            <span>Storage Directory: <code className="font-mono text-[11px] bg-white px-1.5 py-0.5 rounded border border-cyan-200">data/uploads/</code></span>
            <span className="font-semibold text-cyan-700">{image_upload_stats?.total_images ?? 0} Scans Cached</span>
          </div>
        </div>

        {/* Intake Activity Timeline */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs md:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-bold text-slate-800">Assessment Creation Activity Timeline</h2>
            <Clock className="w-4 h-4 text-cyan-600" />
          </div>
          <p className="text-xs text-slate-400 mb-4">Daily intake count persisted in SQLite</p>
          <div className="h-56">
            {activity_timeline?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activity_timeline}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="assessments" fill="#0891b2" radius={[4, 4, 0, 0]} name="Assessments Intake" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No timeline records recorded
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
