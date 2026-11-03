import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, UserPlus, Eye, AlertCircle, Briefcase, MapPin, Droplets, Database } from 'lucide-react';
import { listAssessments } from '../../services/api';

export function PatientHistory() {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAssessments()
      .then(res => setAssessments(res.data.assessments || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Assessment History</h1>
          <p className="text-gray-500 mt-1">
            Audit log of clinical intake sessions persisted in local SQLite storage.
          </p>
        </div>
        <button
          onClick={() => navigate('/doctor/assessment')}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 flex items-center gap-2 shadow-xs"
        >
          <UserPlus className="w-4 h-4" /> New Assessment Intake
        </button>
      </div>

      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
        <Database className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <p className="text-xs text-emerald-900 leading-relaxed">
          <strong>Persistent SQLite Storage Active:</strong> All patient intakes below are stored locally in <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-200 text-emerald-800">data/mediinsight.db</code> and dynamically synchronized into the Analytics Workspace. They remain strictly segregated from external research cohorts.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" /> Patient Assessment Audit Register
          </span>
          <span className="text-xs text-gray-500 font-semibold">{assessments.length} records persisted</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400">Loading assessment history...</div>
        ) : assessments.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm text-gray-500">No assessments created in this database yet.</p>
            <button
              onClick={() => navigate('/doctor/assessment')}
              className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-100"
            >
              Create Sample Assessment
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white border-b border-gray-200 font-semibold text-gray-500 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Patient ID</th>
                  <th className="py-3 px-4">Demographics</th>
                  <th className="py-3 px-4">Occupation & Address</th>
                  <th className="py-3 px-4">Histology & Stage</th>
                  <th className="py-3 px-4 text-center">Blood Workup</th>
                  <th className="py-3 px-4 text-center">Images</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assessments.map((a: any) => {
                  const id = a.id || a.assessment_id;
                  const hasBloodWorkup = Boolean(a.blood_workup);
                  return (
                    <tr key={id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                        {id}
                      </td>
                      <td className="py-3 px-4">
                        <strong className="text-gray-900 block">{a.age} yrs</strong>
                        <span className="text-gray-500 capitalize">{a.gender} · {a.smoking_history || 'Unknown'}</span>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex items-center gap-1.5 text-gray-800 font-medium">
                          <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{a.occupation || 'Unspecified'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500 text-[11px] mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{a.address || 'Not provided'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="capitalize text-gray-800 font-medium block">{a.histology || 'NOS'}</span>
                        <span className="text-blue-800 font-bold font-mono text-[11px]">Stage {a.overall_stage || 'I'}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {hasBloodWorkup ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-[10px] font-semibold">
                            <Droplets className="w-3 h-3" />
                            <span>CBC / LFT / RFT</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px]">
                            Not Recorded
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono text-slate-700 font-semibold">
                          {a.image_count ?? (a.images ? a.images.length : 0)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => navigate('/doctor/clinical-analysis', { state: { assessmentId: id, assessment: a } })}
                          className="px-3 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-semibold inline-flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> Analyze
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
