import React, { useState, useEffect } from 'react';
import { Database, HardDrive, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, FileText } from 'lucide-react';
import { listDatasets, getDatasetStats } from '../../services/api';

export function DatasetManagement() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listDatasets(), getDatasetStats()])
      .then(([dsRes, statsRes]) => {
        setDatasets(dsRes.data.datasets || (Array.isArray(dsRes.data) ? dsRes.data : []));
        setStats(statsRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dataset Management & Governance</h1>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-semibold rounded-full border border-blue-200">
              System Layer
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Governance, file paths, integrity status, and cohort boundaries across all ingested datasets.
          </p>
        </div>
      </div>

      {/* Governance Notice */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
        <div className="text-xs text-emerald-950">
          <strong className="font-semibold text-emerald-900">Strict Cohort Isolation Policy:</strong>
          <span className="ml-1 text-emerald-800">
            NoduleMNIST3D, NSCLC-Radiomics, NSCLC Radiogenomics, TCIA Diagnosis, and Doctor-Created Assessments are strictly separated. No patient records are artificially merged or linked without biological identifiers.
          </span>
        </div>
      </div>

      {/* Dataset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* SQLite Database Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-bold">
                SQL
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Doctor Assessments (SQLite DB)</h3>
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active Persistence Layer
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-mono font-semibold rounded-md">
              data/mediinsight.db
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Stores clinical assessments, AJCC staging, biomarkers, and uploaded medical scan metadata with dynamic sync to Analytics.
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div>
              <span className="text-slate-400">Schema Tables:</span>
              <div className="font-mono font-semibold text-slate-800 mt-0.5">assessments, medical_images</div>
            </div>
            <div>
              <span className="text-slate-400">Upload Directory:</span>
              <div className="font-mono font-semibold text-slate-800 mt-0.5">data/uploads/</div>
            </div>
          </div>
        </div>

        {/* Ingested Datasets */}
        {datasets.map((ds: any) => (
          <div key={ds.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{ds.name}</h3>
                  <span className="text-[11px] text-slate-500">{ds.modality || 'Clinical Data'}</span>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-md border border-emerald-200">
                Verified Ingested
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">{ds.description || 'Healthcare research dataset'}</p>
            <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400">Records:</span>
                <div className="font-semibold text-slate-800 mt-0.5">{ds.records || 'N/A'}</div>
              </div>
              <div>
                <span className="text-slate-400">Format:</span>
                <div className="font-mono font-semibold text-slate-800 mt-0.5">{ds.format || 'CSV'}</div>
              </div>
              <div>
                <span className="text-slate-400">Cohort ID:</span>
                <div className="font-mono font-semibold text-slate-800 mt-0.5">{ds.id}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
