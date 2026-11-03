import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { useApi } from '../../hooks/useApi';
import { getClinicalAnalytics, getTreatmentAnalytics } from '../../services/api';
import { CHART_COLORS } from '../../utils/colors';

export function PatientAnalytics() {
  const { data: clinical, loading: loadClin } = useApi(getClinicalAnalytics);
  const { data: treatment, loading: loadTreat } = useApi(getTreatmentAnalytics);

  if (loadClin || loadTreat) {
    return <div className="p-12 text-center text-sm text-slate-400">Loading patient demographic analytics...</div>;
  }

  const genderHistData = clinical?.gender_histology || [];
  const smokingData = treatment?.smoking_history || [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Patient Population Analytics</h1>
        <p className="text-slate-500 text-sm mt-1">
          Deep demographic stratification, smoking status, and cross-variable correlations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gender vs Histology */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-800 mb-1">Histology by Gender</h2>
          <p className="text-xs text-slate-400 mb-4">Cross-tabulation from NSCLC-Radiomics (n=422)</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={genderHistData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="Histology" stroke="#94a3b8" fontSize={10} angle={-15} textAnchor="end" height={50} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" fill="#0284c7" radius={[4, 4, 0, 0]} name="Patient Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Smoking Status */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-800 mb-1">Smoking History Stratification</h2>
          <p className="text-xs text-slate-400 mb-4">NSCLC Radiogenomics cohort (n=211)</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={smokingData}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  label={({ payload }: any) => `${payload.status}: ${payload.count}`}
                >
                  {smokingData.map((_: any, index: number) => (
                    <Cell key={`smk-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`${value} patients`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
