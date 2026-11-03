import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Pill, AlertTriangle, Info, CheckCircle2, XCircle, ArrowRight, RefreshCw,
  Dna, Activity, BarChart2, ShieldAlert, Award, FileText, ChevronRight, Layers
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell
} from 'recharts';
import { getRecommendations, getTreatmentAnalytics, listAssessments, getAssessment } from '../../services/api';
import { CHART_COLORS } from '../../utils/colors';

export function TreatmentRecommendations() {
  const location = useLocation();
  const navigate = useNavigate();

  const [assessmentId, setAssessmentId] = useState<string>(
    location.state?.patient?.id || 'DEMO-0001'
  );
  const [allAssessments, setAllAssessments] = useState<any[]>([]);
  const [patient, setPatient] = useState<any>(
    location.state?.patient || {
      id: 'DEMO-0001',
      age: 68,
      gender: 'male',
      histology: 'adenocarcinoma',
      overall_stage: 'IIIa',
      t_stage: '2',
      n_stage: '2',
      m_stage: '0',
      egfr_status: 'Positive',
      kras_status: 'Negative',
      alk_status: 'Negative',
      smoking_history: 'Former Smoker',
      performance_status: 'ECOG 1',
    }
  );

  const [recData, setRecData] = useState<any>(null);
  const [cohortTreatment, setCohortTreatment] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listAssessments()
      .then(res => setAllAssessments(res.data.assessments || []))
      .catch(() => {});

    getTreatmentAnalytics()
      .then(res => setCohortTreatment(res.data))
      .catch(() => {});
  }, []);

  const fetchRecommendationsForPatient = (p: any) => {
    setLoading(true);
    getRecommendations(p)
      .then(res => setRecData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRecommendationsForPatient(patient);
  }, [patient]);

  const handleAssessmentChange = (id: string) => {
    setAssessmentId(id);
    getAssessment(id)
      .then(res => {
        setPatient(res.data.assessment);
      })
      .catch(() => {});
  };

  // Treatment category distribution data
  const categoryData = recData?.candidates ? Object.entries(
    recData.candidates.reduce((acc: any, c: any) => {
      acc[c.category] = (acc[c.category] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, count]) => ({ name, count })) : [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Clinical Decision Support: Treatment Pathways</h1>
          <p className="text-gray-500 text-xs mt-1">
            Guideline-aligned candidate pathway ranking, clinical evidence evaluation, and retrospective cohort treatment patterns.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Patient Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">Active Patient:</span>
            <select
              value={assessmentId}
              onChange={(e) => handleAssessmentChange(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white font-mono font-bold"
            >
              {allAssessments.map(a => (
                <option key={a.id} value={a.id}>
                  {a.id} ({a.overall_stage}, {a.histology})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => navigate('/doctor/similar-cases', { state: { patient } })}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            <span>Match Similar Cases</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mandatory Clinical Safety Disclaimer */}
      <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-start gap-3">
        <ShieldAlert className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-950 space-y-1">
          <h3 className="font-bold text-xs uppercase tracking-wide text-amber-900">
            Experimental Decision-Support Prototype — Non-Prescriptive Academic Model
          </h3>
          <p className="leading-relaxed text-[11px] text-amber-900">
            Candidate ranking scores represent heuristic guideline-matching weights derived from NCCN clinical practice standards,
            <strong> NOT</strong> individualized probabilities of therapeutic cure or patient survival.
            Final systemic, radiation, and surgical regimens must strictly be formulated by certified multidisciplinary oncology tumor boards.
          </p>
        </div>
      </div>

      {/* SECTION A: CLINICAL CONTEXT SUMMARY CARDS */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" /> Section A: Patient Clinical Context Matrix
          </span>
          <span className="text-[11px] text-gray-400 font-mono">Patient Ref: {patient.id}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
          <div><span className="text-gray-400 block text-[11px]">Age & Gender</span><strong className="text-gray-900">{patient.age} yrs, {patient.gender}</strong></div>
          <div><span className="text-gray-400 block text-[11px]">Histology</span><strong className="text-gray-900 capitalize truncate block">{patient.histology}</strong></div>
          <div><span className="text-gray-400 block text-[11px]">Clinical Stage</span><strong className="text-blue-700 font-bold uppercase">{patient.overall_stage} (T{patient.t_stage}N{patient.n_stage}M{patient.m_stage})</strong></div>
          <div><span className="text-gray-400 block text-[11px]">EGFR Status</span><strong className={patient.egfr_status === 'Positive' ? 'text-amber-700 font-bold' : 'text-gray-700'}>{patient.egfr_status}</strong></div>
          <div><span className="text-gray-400 block text-[11px]">ALK Status</span><strong className={patient.alk_status === 'Positive' ? 'text-purple-700 font-bold' : 'text-gray-700'}>{patient.alk_status}</strong></div>
          <div><span className="text-gray-400 block text-[11px]">Performance</span><strong className="text-emerald-700">{patient.performance_status || 'ECOG 0'}</strong></div>
        </div>
      </div>

      {/* SECTION B: CANDIDATE TREATMENT PATHWAYS RANKED TABLE */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-gray-800">Section B: Candidate Treatment Pathways (Ranked by Guideline Alignment)</h2>
          </div>
          <span className="text-xs text-gray-500">NSCLC Staging Criteria</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400">Computing guideline alignment scores...</div>
        ) : recData?.candidates ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-white border-b border-gray-200 text-gray-500 font-semibold">
                <tr>
                  <th className="py-3 px-4 w-14 text-center">Rank</th>
                  <th className="py-3 px-4">Treatment Pathway</th>
                  <th className="py-3 px-4 w-32">Modality</th>
                  <th className="py-3 px-4 w-28 text-center">Alignment Score</th>
                  <th className="py-3 px-4">Supporting Factors</th>
                  <th className="py-3 px-4">Limiting Factors / Contraindications</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recData.candidates.map((cand: any) => (
                  <tr key={cand.rank} className="hover:bg-blue-50/20 transition-colors">
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        cand.rank === 1 ? 'bg-blue-600 text-white' : cand.rank === 2 ? 'bg-cyan-100 text-cyan-800' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {cand.rank}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900 text-xs">{cand.option}</div>
                      <span className="text-[10px] text-gray-400 block mt-0.5">{cand.evidence_basis}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[11px] font-medium">
                        {cand.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono font-bold text-blue-700 text-sm">{(cand.ranking_score).toFixed(2)}</span>
                      <div className="w-16 bg-gray-200 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${cand.ranking_score * 100}%` }} />
                      </div>
                    </td>
                    <td className="py-3 px-4 space-y-1 text-[11px] text-emerald-800">
                      {cand.supporting_factors.map((f: string, i: number) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> {f}
                        </div>
                      ))}
                    </td>
                    <td className="py-3 px-4 space-y-1 text-[11px] text-amber-800">
                      {cand.limiting_factors.map((f: string, i: number) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" /> {f}
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      {/* SECTION C & D: TREATMENT COMPARISON & BIOMARKER RULES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION C: Treatment Category Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-cyan-600" /> Section C: Modality Distribution of Candidate Pathways
            </h3>
            <span className="text-[10px] text-gray-400">Modal Breakdown</span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recData?.candidates?.map((c: any) => ({
                pathway: c.option.split(' ')[0],
                score: c.ranking_score,
                category: c.category,
              })) || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="pathway" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 1]} />
                <Tooltip />
                <Bar dataKey="score" fill="#0284c7" radius={[4, 4, 0, 0]} name="Guideline Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SECTION D: Biomarker-Driven Targeted Therapy Rules */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Dna className="w-4 h-4 text-purple-600" /> Section D: Guideline Biomarker Decision Criteria
            </h3>
            <span className="text-[10px] text-gray-400">NCCN v2024.1 Rules</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className={`p-3 rounded-xl border ${patient.egfr_status === 'Positive' ? 'bg-amber-50/70 border-amber-300' : 'bg-gray-50 border-gray-200'}`}>
              <div className="font-bold text-gray-900 flex items-center justify-between">
                <span>Rule 1: EGFR Sensitizing Mutations (Exon 19 del / L858R)</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${patient.egfr_status === 'Positive' ? 'bg-amber-200 text-amber-900' : 'bg-gray-200 text-gray-600'}`}>
                  {patient.egfr_status === 'Positive' ? 'Triggered (Match)' : 'Inactive'}
                </span>
              </div>
              <p className="text-[11px] text-gray-600 mt-1">
                Recommend third-generation EGFR TKI (Osimertinib 80mg daily) as preferred category 1 first-line therapy.
              </p>
            </div>

            <div className={`p-3 rounded-xl border ${patient.alk_status === 'Positive' ? 'bg-purple-50/70 border-purple-300' : 'bg-gray-50 border-gray-200'}`}>
              <div className="font-bold text-gray-900 flex items-center justify-between">
                <span>Rule 2: ALK Gene Rearrangement Positive</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${patient.alk_status === 'Positive' ? 'bg-purple-200 text-purple-900' : 'bg-gray-200 text-gray-600'}`}>
                  {patient.alk_status === 'Positive' ? 'Triggered (Match)' : 'Inactive'}
                </span>
              </div>
              <p className="text-[11px] text-gray-600 mt-1">
                Recommend second-generation ALK inhibitor (Alectinib 600mg twice daily or Brigatinib).
              </p>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="font-bold text-gray-900 flex items-center justify-between">
                <span>Rule 3: Non-Driver Mutant Advanced Disease (Stage III/IV)</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                  Standard Platinum Doublet
                </span>
              </div>
              <p className="text-[11px] text-gray-600 mt-1">
                In absence of actionable driver mutations, platinum-based chemotherapy (Cisplatin + Pemetrexed) ± Pembrolizumab.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION F: HISTORICAL COHORT TREATMENT PATTERNS */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between border-b pb-2 gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-gray-800">Section F: Retrospective Observational Treatment Analytics (NSCLC Radiogenomics Cohort, n=211)</h3>
          </div>
          <span className="text-[10px] text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-semibold">
            Cohort Data: Non-Randomized
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <h4 className="text-xs font-bold text-gray-700 mb-2">Chemotherapy Administration</h4>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cohortTreatment?.treatment_frequency?.chemotherapy || [
                  { treatment: 'Chemotherapy No', count: 161 },
                  { treatment: 'Chemotherapy Yes', count: 49 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="treatment" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Patients" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <h4 className="text-xs font-bold text-gray-700 mb-2">Radiation Therapy</h4>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cohortTreatment?.treatment_frequency?.radiation || [
                  { treatment: 'Radiation No', count: 194 },
                  { treatment: 'Radiation Yes', count: 16 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="treatment" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Patients" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <h4 className="text-xs font-bold text-gray-700 mb-2">Post-Treatment Recurrence</h4>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={cohortTreatment?.recurrence || [
                      { status: 'No Recurrence', count: 156 },
                      { status: 'Recurrence', count: 54 },
                    ]}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={65}
                    label={({ payload }: any) => `${payload.status}: ${payload.count}`}
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#f43f5e" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-900">
          <strong>Methodological Note on Confounding:</strong> Historical treatment distributions reflect institutional practice at the time of patient enrollment.
          Patients receiving adjuvant chemotherapy were significantly more likely to present with advanced primary tumors or nodal metastases.
        </div>
      </div>

      {/* SECTION G & H: EXPLAINABILITY & LIMITATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-600" /> Section G: Recommendation Transparency & Explainability
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            The decision-support logic uses rule-based clinical trees mapped directly to NCCN Staging & Biomarker protocols.
            Scores are computed as normalized guideline weights based on:
          </p>
          <ul className="text-xs text-gray-700 space-y-1.5 pl-4 list-disc">
            <li><strong>Actionable Biomarker Matches:</strong> +0.25 weight for confirmed EGFR/ALK targets.</li>
            <li><strong>Stage-Specific Intent:</strong> Surgical resection prioritized for Stage I/II curative intent; concurrent chemoradiation prioritized for Stage III unresectable disease.</li>
            <li><strong>Performance Status Feasibility:</strong> Regimen intensity evaluated against ECOG score.</li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Section H: Clinical Boundaries & Limitations
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            This module does not replace clinical judgment:
          </p>
          <ul className="text-xs text-gray-700 space-y-1.5 pl-4 list-disc">
            <li>Does not prescribe medication dosages or treatment schedules.</li>
            <li>Does not model patient-specific organ toxicity (renal/hepatic clearance).</li>
            <li>Does not account for unpublished off-label drug combinations.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
