import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Scan, Database, Activity, UserPlus, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { getDatasetStats, healthCheck } from '../../services/api';

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: React.FC<{ className?: string }>; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </div>
  );
}

export function DoctorDashboard() {
  const navigate = useNavigate();
  const { data: stats, loading } = useApi(getDatasetStats);
  const { data: health } = useApi(healthCheck);

  const totalClinical = stats
    ? ((stats as Record<string, Record<string, number>>).nsclc_radiomics?.total_records || 0) +
      ((stats as Record<string, Record<string, number>>).nsclc_radiogenomics?.total_records || 0)
    : null;
  const totalImaging = 1633;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
        <p className="text-gray-500 mt-1">Clinical decision support — research prototype</p>
      </div>

      {/* System status */}
      <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-green-600" />
        <span className="text-sm text-green-700">System online — API connected</span>
        {health && <span className="text-xs text-green-600 ml-auto">v{((health as any).version || '1.0.0')}</span>}
      </div>

      {/* Disclaimer */}
      <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-xl">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-amber-800 text-sm">Academic Research Prototype</div>
            <div className="text-xs text-amber-700 mt-1">
              This system uses research datasets (NSCLC-Radiomics, NoduleMNIST3D) and is not validated for clinical use.
              All analyses are exploratory and must not influence real patient care decisions.
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Clinical Records"
          value={loading ? '...' : (totalClinical ?? 'N/A')}
          icon={Users}
          color="bg-blue-600"
        />
        <StatCard
          label="Imaging Samples"
          value="3,927"
          icon={Scan}
          color="bg-cyan-600"
        />
        <StatCard
          label="Datasets Available"
          value={6}
          icon={Database}
          color="bg-indigo-600"
        />
        <StatCard
          label="System Status"
          value="Online"
          icon={Activity}
          color="bg-green-600"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/doctor/assessment')}
            className="flex items-center gap-4 p-5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-left"
          >
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold">New Patient Assessment</div>
              <div className="text-blue-100 text-sm">Enter clinical details and get analysis</div>
            </div>
          </button>
          <button
            onClick={() => navigate('/doctor/similar-cases')}
            className="flex items-center gap-4 p-5 bg-white border border-gray-200 text-gray-800 rounded-xl hover:bg-gray-50 transition-colors text-left"
          >
            <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <div className="font-semibold">Find Similar Cases</div>
              <div className="text-gray-500 text-sm">Retrieve similar research cases</div>
            </div>
          </button>
        </div>
      </div>

      {/* Available Datasets */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Available Research Datasets</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Dataset</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Records</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'NSCLC-Radiomics (Lung1)', type: 'Clinical & Staging', records: 422 },
                { name: 'NSCLC Radiogenomics', type: 'Clinical + Molecular', records: 211 },
                { name: 'NoduleMNIST3D', type: '3D CT Volumetric Benchmark', records: 1633 },
                { name: 'IQ-OTH/NCCD Lung CT', type: 'Full-Res 512×512 Siemens CT', records: 1294 },
                { name: 'Chest CT Cancer Subtypes', type: 'Histology & Stage Cross-Sections', records: 1000 },
                { name: 'TCIA Diagnosis Data', type: 'Diagnosis Metadata', records: 157 },
              ].map((d, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 text-gray-900">{d.name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{d.type}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-gray-700">{d.records.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Note: These are separate research cohorts. Records cannot be merged without patient-level linkage.
        </p>
      </div>
    </div>
  );
}

