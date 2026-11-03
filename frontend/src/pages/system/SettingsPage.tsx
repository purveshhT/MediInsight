import React, { useState } from 'react';
import { Settings, Database, HardDrive, Cpu, ShieldCheck, Check, Server, Info } from 'lucide-react';

export function SettingsPage() {
  const [apiEndpoint, setApiEndpoint] = useState('http://localhost:8000/api');
  const [theme, setTheme] = useState('light');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System & Runtime Configuration</h1>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-800 text-[11px] font-semibold rounded-full border border-slate-200">
              Settings
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Backend connection parameters, persistent storage paths, and academic research settings.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors self-start md:self-auto"
        >
          {saved ? <Check className="w-4 h-4 text-white" /> : <Settings className="w-4 h-4 text-white" />}
          <span>{saved ? 'Settings Saved' : 'Save Configuration'}</span>
        </button>
      </div>

      <div className="space-y-5">
        {/* Connection Settings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            <Server className="w-4 h-4 text-blue-600" />
            <span>FastAPI Backend Services</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                API Base URL
              </label>
              <input
                type="text"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Execution Mode
              </label>
              <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 flex items-center justify-between">
                <span>CPU Execution (Windows Compatible)</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                  ONLINE
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Persistence Paths */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            <HardDrive className="w-4 h-4 text-cyan-600" />
            <span>Local Filesystem & Storage Paths</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <strong className="text-slate-800">SQLite Database Path:</strong>
                <p className="text-slate-500 text-[11px]">Dynamic clinical patient intake persistence</p>
              </div>
              <code className="font-mono text-cyan-800 bg-cyan-50 px-2 py-1 rounded border border-cyan-200 text-[11px]">
                c:\dav_7\MediInsight-AI\data\mediinsight.db
              </code>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <strong className="text-slate-800">Medical Scans Upload Directory:</strong>
                <p className="text-slate-500 text-[11px]">Multi-format patient image storage (PNG, JPG, DICOM, NIfTI)</p>
              </div>
              <code className="font-mono text-cyan-800 bg-cyan-50 px-2 py-1 rounded border border-cyan-200 text-[11px]">
                c:\dav_7\MediInsight-AI\data\uploads\
              </code>
            </div>
          </div>
        </div>

        {/* Academic Project Governance Disclosure */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Academic Capstone Governance & Medical Limitations</span>
          </div>

          <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
            <p>
              <strong>BTech IT Capstone:</strong> MediInsight AI is an academic multimodal analytics platform designed to demonstrate healthcare data exploration, medical image processing, and rule-based decision support.
            </p>
            <p>
              <strong>Observational Research:</strong> All survival data and treatment patterns are observational and historical. They do not constitute formal medical diagnoses or prospective clinical trial efficacy claims.
            </p>
            <p>
              <strong>Data Isolation:</strong> NoduleMNIST3D volumes represent low-resolution preprocessed research benchmarks and are never linked as diagnostic scans of patients in the NSCLC clinical cohorts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
