import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Microscope, Activity, Scan, AlertCircle, ArrowRight, Brain, CheckCircle2,
  HelpCircle, Calendar, Users, Dna, FileText, ChevronRight, Layers, Eye,
  BarChart2, PieChart as PieIcon, ShieldAlert, Sparkles, Image as ImageIcon,
  Briefcase, MapPin, Droplets, FlaskConical
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, CartesianGrid
} from 'recharts';
import {
  getAssessment, getImagingSample, predictNodule, getClinicalAnalytics,
  listAssessments, getImageFileUrl
} from '../../services/api';
import { CHART_COLORS } from '../../utils/colors';

export function ClinicalAnalysis() {
  const location = useLocation();
  const navigate = useNavigate();

  // Try to load assessment from state or fetch recent assessment from SQLite
  const [assessmentId, setAssessmentId] = useState<string>(
    location.state?.assessmentId || location.state?.assessment?.id || 'DEMO-0001'
  );
  const [assessmentData, setAssessmentData] = useState<any>(null);
  const [clinicalCohort, setClinicalCohort] = useState<any>(null);
  const [allAssessments, setAllAssessments] = useState<any[]>([]);

  // 3D Volume slice state
  const [researchSample, setResearchSample] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [loadingPred, setLoadingPred] = useState(false);
  const [activeSlice, setActiveSlice] = useState<'slice_25pct' | 'slice_50pct' | 'slice_75pct'>('slice_50pct');

  // Load available assessments for switcher
  useEffect(() => {
    listAssessments()
      .then(res => setAllAssessments(res.data.assessments || []))
      .catch(() => {});
    
    getClinicalAnalytics()
      .then(res => setClinicalCohort(res.data))
      .catch(() => {});
  }, []);

  // Fetch target assessment details from SQLite
  useEffect(() => {
    if (!assessmentId) return;
    getAssessment(assessmentId)
      .then(res => {
        setAssessmentData(res.data);
        const sampleId = res.data.assessment?.research_sample_id ?? 12;
        const split = res.data.assessment?.research_split ?? 'test';
        getImagingSample(sampleId, split)
          .then(imgRes => setResearchSample(imgRes.data))
          .catch(() => {});
      })
      .catch(() => {});
  }, [assessmentId]);

  const patient = assessmentData?.assessment || {
    id: 'DEMO-0001',
    age: 68,
    gender: 'male',
    smoking_history: 'Former Smoker',
    smoking_pack_years: 35,
    histology: 'adenocarcinoma',
    overall_stage: 'II',
    t_stage: '2',
    n_stage: '1',
    m_stage: '0',
    clinical_stage: 'Stage IIB',
    pathological_stage: 'pT2aN1M0',
    performance_status: 'ECOG 0',
    egfr_status: 'Positive',
    kras_status: 'Negative',
    alk_status: 'Negative',
    other_biomarkers: 'PD-L1: 45%',
    medical_history: 'Hypertension, coronary stent in 2021',
    comorbidities: 'Hypertension',
    notes: 'Solitary right lower lobe nodule. Patient undergoing multimodal workup.'
  };

  const images = assessmentData?.images || [];

  const handlePredict = () => {
    const sampleId = patient.research_sample_id ?? 12;
    const split = patient.research_split ?? 'test';
    setLoadingPred(true);
    predictNodule(sampleId, split)
      .then(res => setPrediction(res.data))
      .catch(() => {})
      .finally(() => setLoadingPred(false));
  };

  // Cohort comparison metrics
  const cohortMeanAge = 67.8;
  const cohortMedianAge = 67.0;
  const ageDelta = Math.abs(patient.age - cohortMedianAge).toFixed(1);
  const ageComparisonText = patient.age === cohortMedianAge
    ? 'exactly at the cohort median (67.0 years).'
    : patient.age > cohortMedianAge
    ? `${ageDelta} years older than the cohort median (67.0 yrs).`
    : `${ageDelta} years younger than the cohort median (67.0 yrs).`;

  // Missing fields completeness calculation
  const criticalFields = [
    { label: 'Patient Age', val: patient.age },
    { label: 'Histology', val: patient.histology },
    { label: 'Overall Stage', val: patient.overall_stage },
    { label: 'TNM Classification', val: patient.t_stage && patient.n_stage && patient.m_stage },
    { label: 'Occupation', val: patient.occupation && patient.occupation !== 'Unspecified' },
    { label: 'Residential Address', val: patient.address && patient.address !== 'Not provided' },
    { label: 'Blood Workup', val: Boolean(patient.blood_workup) },
    { label: 'EGFR Status', val: patient.egfr_status && patient.egfr_status !== 'Not Tested' && patient.egfr_status !== 'Unknown' },
    { label: 'KRAS Status', val: patient.kras_status && patient.kras_status !== 'Not Tested' && patient.kras_status !== 'Unknown' },
    { label: 'ALK Status', val: patient.alk_status && patient.alk_status !== 'Not Tested' && patient.alk_status !== 'Unknown' },
    { label: 'Performance Status', val: patient.performance_status },
    { label: 'Uploaded Scan', val: images.length > 0 || patient.research_sample_id !== null },
  ];

  const completedCount = criticalFields.filter(f => Boolean(f.val)).length;
  const completenessPct = Math.round((completedCount / criticalFields.length) * 100);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header & Patient Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Clinical & Diagnostic Analysis</h1>
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-mono font-bold rounded-md">
              {patient.id}
            </span>
          </div>
          <p className="text-gray-500 text-xs mt-1">
            Multimodal clinical characteristics, comparative cohort analytics, and volumetric scan evaluation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Assessment Picker */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">Inspect Assessment:</span>
            <select
              value={assessmentId}
              onChange={(e) => setAssessmentId(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white font-mono font-bold"
            >
              {allAssessments.map(a => (
                <option key={a.id} value={a.id}>
                  {a.id} ({a.age}y, {a.gender}, {a.overall_stage})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => navigate('/doctor/recommendations', { state: { patient } })}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            <span>Review Treatment Pathways</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SECTION A: PATIENT CLINICAL SUMMARY CARDS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" /> Section A: Patient Clinical Summary Profile
          </h2>
          <span className="text-xs text-gray-500">Record Origin: Local SQLite Intake</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
            <span className="text-[11px] text-gray-400 block mb-0.5">Demographics</span>
            <strong className="text-sm text-gray-900 block">{patient.age} yrs</strong>
            <span className="text-[11px] text-gray-500 capitalize">{patient.gender} · {patient.smoking_history}</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
            <span className="text-[11px] text-gray-400 block mb-0.5">Histology</span>
            <strong className="text-sm text-blue-900 capitalize block truncate">{patient.histology}</strong>
            <span className="text-[11px] text-gray-500">NSCLC Subtype</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
            <span className="text-[11px] text-gray-400 block mb-0.5">Cancer Staging</span>
            <strong className="text-sm text-blue-700 block uppercase font-extrabold">{patient.overall_stage}</strong>
            <span className="text-[11px] text-gray-500 font-mono">T{patient.t_stage} N{patient.n_stage} M{patient.m_stage}</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
            <span className="text-[11px] text-gray-400 block mb-0.5">Functional Status</span>
            <strong className="text-sm text-gray-900 block">{patient.performance_status || 'ECOG 0'}</strong>
            <span className="text-[11px] text-emerald-600 font-semibold">Tolerates Standard Regimens</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
            <span className="text-[11px] text-gray-400 block mb-0.5">Molecular Status</span>
            <div className="text-[11px] font-bold space-y-0.5">
              <span className={patient.egfr_status === 'Positive' ? 'text-amber-600' : 'text-gray-700'}>EGFR: {patient.egfr_status}</span>
              <span className="block text-gray-400 font-normal">ALK: {patient.alk_status}</span>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
            <span className="text-[11px] text-gray-400 block mb-0.5">Imaging Status</span>
            <strong className="text-sm text-cyan-800 block">
              {images.length > 0 ? `${images.length} Uploaded Scan` : `Sample #${patient.research_sample_id ?? 12}`}
            </strong>
            <span className="text-[11px] text-cyan-600">3D Volumetric Analysis</span>
          </div>
        </div>

        {/* Patient Demographics & Residence Ribbon */}
        <div className="mt-3 p-3.5 bg-white border border-gray-200 rounded-xl shadow-xs grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Briefcase className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-semibold block">Occupation</span>
              <strong className="text-gray-800 font-medium">{patient.occupation || 'Unspecified'}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-gray-400 uppercase font-semibold block">Residential Address</span>
              <span className="text-gray-800 truncate block font-medium">{patient.address || 'Not provided'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION B & C: DEMOGRAPHIC & STAGING ANALYTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION B: Demographic Analytics vs Cohort */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" /> Section B: Patient Age vs Research Cohort Distribution
            </h3>
            <span className="text-[10px] text-gray-400">NSCLC-Radiomics (n=422)</span>
          </div>

          <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-xs text-blue-900">
            <strong>Cohort Age Comparison:</strong> Patient is <strong>{patient.age} years old</strong>, which is {ageComparisonText}
            The cohort interquartile range is 61.0 - 75.0 years.
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { group: '<50 yrs', patients: 18, currentPatient: patient.age < 50 ? 1 : 0 },
                { group: '50-59 yrs', patients: 68, currentPatient: (patient.age >= 50 && patient.age < 60) ? 1 : 0 },
                { group: '60-69 yrs', patients: 172, currentPatient: (patient.age >= 60 && patient.age < 70) ? 1 : 0 },
                { group: '70-79 yrs', patients: 124, currentPatient: (patient.age >= 70 && patient.age < 80) ? 1 : 0 },
                { group: '80+ yrs', patients: 40, currentPatient: patient.age >= 80 ? 1 : 0 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="group" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="patients" fill="#93c5fd" radius={[4, 4, 0, 0]} name="Cohort Patients" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SECTION C: Cancer Staging Analytics */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" /> Section C: Staging Matrix & Prognostic Stratification
            </h3>
            <span className="text-[10px] text-gray-400">AJCC Staging Analysis</span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Primary Tumor</span>
              <span className="text-base font-extrabold text-gray-900 font-mono">T{patient.t_stage}</span>
              <span className="text-[10px] text-gray-500 block mt-0.5">
                {patient.t_stage === '1' ? '≤ 3 cm' : patient.t_stage === '2' ? '3 - 5 cm' : '&gt; 5 cm'}
              </span>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Regional Nodes</span>
              <span className="text-base font-extrabold text-indigo-700 font-mono">N{patient.n_stage}</span>
              <span className="text-[10px] text-gray-500 block mt-0.5">
                {patient.n_stage === '0' ? 'No nodal spread' : patient.n_stage === '1' ? 'Ipsilateral hilar' : 'Mediastinal'}
              </span>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Distant Metastasis</span>
              <span className="text-base font-extrabold text-emerald-700 font-mono">M{patient.m_stage}</span>
              <span className="text-[10px] text-gray-500 block mt-0.5">
                {patient.m_stage === '0' ? 'M0 (Non-metastatic)' : 'M1 (Metastatic)'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Cohort Median Survival (Stage {patient.overall_stage}):</span>
              <strong className="text-gray-900 font-mono">
                {patient.overall_stage.includes('I') ? '742 days' : patient.overall_stage.includes('II') ? '510 days' : '385 days'}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cohort Representation:</span>
              <span className="font-semibold text-blue-700">
                {patient.overall_stage.includes('III') ? '41.7% of cohort (Stage IIIa/IIIb)' : '22.0% of cohort'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION D & E: HISTOPATHOLOGY & MOLECULAR BIOMARKER PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION D: Histopathology Analytics */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Microscope className="w-4 h-4 text-cyan-600" /> Section D: Histopathological Subtype Analytics
            </h3>
            <span className="text-[10px] text-gray-400">Relative Prevalence</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex-1 bg-cyan-50 p-3 rounded-xl border border-cyan-200">
              <span className="text-cyan-700 block font-semibold">Patient Subtype:</span>
              <span className="text-sm font-bold text-cyan-950 capitalize">{patient.histology}</span>
              <p className="text-[10px] text-cyan-800 mt-1">
                {patient.histology === 'adenocarcinoma'
                  ? 'Glandular differentiation; most frequent subtype in non-smokers and candidates for EGFR/ALK TKIs.'
                  : 'Typically associated with tobacco exposure and central airway cavitation.'}
              </p>
            </div>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { type: 'Squamous Cell', count: 152 },
                { type: 'Large Cell', count: 114 },
                { type: 'NOS', count: 63 },
                { type: 'Adenocarcinoma', count: 51 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="type" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" fill="#0891b2" radius={[4, 4, 0, 0]} name="Cohort Cases" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SECTION E: Molecular Biomarker Analytics */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Dna className="w-4 h-4 text-purple-600" /> Section E: Molecular Biomarker Profiling & TKI Suitability
            </h3>
            <span className="text-[10px] text-gray-400">Genomic Screening</span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className={`p-3 rounded-xl border ${patient.egfr_status === 'Positive' ? 'bg-amber-50 border-amber-300' : 'bg-gray-50 border-gray-200'}`}>
              <span className="text-gray-500 block text-[10px] font-bold">EGFR Status</span>
              <strong className={`text-sm block ${patient.egfr_status === 'Positive' ? 'text-amber-800' : 'text-gray-900'}`}>
                {patient.egfr_status}
              </strong>
              <span className="text-[10px] text-gray-400 mt-1 block">
                {patient.egfr_status === 'Positive' ? 'Eligible for Osimertinib' : 'TKI non-responsive'}
              </span>
            </div>

            <div className={`p-3 rounded-xl border ${patient.kras_status === 'Positive' ? 'bg-rose-50 border-rose-300' : 'bg-gray-50 border-gray-200'}`}>
              <span className="text-gray-500 block text-[10px] font-bold">KRAS Status</span>
              <strong className={`text-sm block ${patient.kras_status === 'Positive' ? 'text-rose-800' : 'text-gray-900'}`}>
                {patient.kras_status}
              </strong>
              <span className="text-[10px] text-gray-400 mt-1 block">
                {patient.kras_status === 'Positive' ? 'MAPK driver mutant' : 'KRAS wildtype'}
              </span>
            </div>

            <div className={`p-3 rounded-xl border ${patient.alk_status === 'Positive' ? 'bg-purple-50 border-purple-300' : 'bg-gray-50 border-gray-200'}`}>
              <span className="text-gray-500 block text-[10px] font-bold">ALK Status</span>
              <strong className={`text-sm block ${patient.alk_status === 'Positive' ? 'text-purple-800' : 'text-gray-900'}`}>
                {patient.alk_status}
              </strong>
              <span className="text-[10px] text-gray-400 mt-1 block">
                {patient.alk_status === 'Positive' ? 'Candidate for Alectinib' : 'ALK wildtype'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-xl text-xs text-purple-900 space-y-1">
            <span className="font-bold block">Targeted Therapy Decision Rule:</span>
            <p className="text-[11px] leading-relaxed">
              National Comprehensive Cancer Network (NCCN) guidelines dictate that patients with sensitizing EGFR mutations or ALK rearrangements
              should receive appropriate tyrosine kinase inhibitors in the first-line setting prior to conventional systemic chemotherapy.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION F: MEDICAL IMAGING ANALYTICS & 3D CT SLICE VIEWER */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between border-b pb-3 gap-2">
          <div className="flex items-center gap-2">
            <Scan className="w-5 h-5 text-cyan-600" />
            <h3 className="text-sm font-bold text-gray-800">Section F: Medical Imaging Analytics & 3D Volume Exploration</h3>
          </div>
          <span className="text-xs px-2.5 py-0.5 bg-cyan-50 text-cyan-800 border border-cyan-200 rounded-md font-semibold">
            Volumetric Radiomic Analysis
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left: Uploaded Scan View (if any) or Research 3D Volume */}
          <div className="space-y-4">
            <div className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              {images.length > 0 ? '1. Uploaded Patient Scan (Local Storage)' : '1. Associated 3D CT Volume (NoduleMNIST3D)'}
            </div>

            {images.length > 0 ? (
              <div className="bg-black p-4 rounded-2xl border-2 border-gray-800 flex flex-col items-center justify-center">
                <img
                  src={getImageFileUrl(images[0].id)}
                  alt="Uploaded Patient Scan"
                  className="max-h-64 object-contain rounded-lg"
                />
                <div className="text-[11px] text-gray-400 mt-3 font-mono">
                  {images[0].original_filename} ({images[0].image_dimensions} · {images[0].file_format.toUpperCase()})
                </div>
              </div>
            ) : researchSample?.slices ? (
              <div className="flex flex-col items-center">
                <div className="bg-black p-3 rounded-2xl border-2 border-neutral-800 shadow-md">
                  <div
                    className="grid grid-cols-28 gap-0 border border-neutral-700"
                    style={{ gridTemplateColumns: 'repeat(28, minmax(0, 1fr))', width: 224, height: 224 }}
                  >
                    {researchSample.slices[activeSlice]?.flat().map((pixelVal: number, idx: number) => (
                      <div
                        key={idx}
                        style={{ backgroundColor: `rgb(${pixelVal}, ${pixelVal}, ${pixelVal})` }}
                        className="w-2 h-2"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 mt-3 text-xs bg-gray-100 p-1.5 rounded-xl">
                  {(['slice_25pct', 'slice_50pct', 'slice_75pct'] as const).map(sl => (
                    <button
                      key={sl}
                      onClick={() => setActiveSlice(sl)}
                      className={`px-3 py-1 rounded-lg font-medium transition-all ${
                        activeSlice === sl ? 'bg-white text-cyan-800 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      {sl === 'slice_25pct' ? 'Axial 25%' : sl === 'slice_50pct' ? 'Center 50%' : 'Axial 75%'}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-gray-400 border rounded-xl">No imaging scan attached</div>
            )}
          </div>

          {/* Right: AI Prediction & Radiomic Metrics */}
          <div className="space-y-4">
            <div className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              2. 3D Volume Malignancy Classification
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Volumetric Grid:</span>
                <span className="font-mono font-bold">28 × 28 × 28 Voxels (uint8)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Benchmark Model:</span>
                <span>Random Forest (100 Trees, Class Weighted)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Held-Out Test ROC-AUC:</span>
                <strong className="text-blue-700 font-mono">0.8941</strong>
              </div>
            </div>

            <button
              onClick={handlePredict}
              disabled={loadingPred}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <Brain className="w-4 h-4" />
              <span>{loadingPred ? 'Computing Radiomic Descriptors...' : 'Run Automated 3D Volume Classifier'}</span>
            </button>

            {prediction && (
              <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-cyan-950">Predicted Malignancy Status:</span>
                  <span className={`px-2.5 py-1 rounded-md font-bold text-xs ${
                    prediction.predicted_label === 1 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {prediction.predicted_label_name}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-cyan-900">
                  <div className="flex justify-between">
                    <span>P(Benign):</span>
                    <strong className="font-mono">{(prediction.probabilities.Benign * 100).toFixed(1)}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>P(Malignant):</span>
                    <strong className="font-mono">{(prediction.probabilities.Malignant * 100).toFixed(1)}%</strong>
                  </div>
                </div>

                <p className="text-[10px] text-cyan-800 italic">
                  Evaluated using 20 volumetric intensity and gradient descriptors. Research prototype; not validated for clinical diagnosis.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION: BLOOD WORKUP & LABORATORY INVESTIGATIONS */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between border-b pb-3 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center font-bold">
              <Droplets className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Laboratory Investigations & Blood Workup</h2>
              <span className="text-[11px] text-gray-500">
                Hematology, Hepatic, Renal, and Serum Electrolyte Biomarkers
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {patient.blood_workup?.report_file && (
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-200 font-medium flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>Lab Report Attached: {patient.blood_workup.report_file}</span>
              </span>
            )}
            <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
              Adult Reference Standards
            </span>
          </div>
        </div>

        {patient.blood_workup ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* CBC Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-800">Complete Blood Count (CBC)</span>
                  <span className="text-[10px] text-slate-400">Hematology</span>
                </div>
                <div className="space-y-2 text-xs">
                  {[
                    { key: 'hemoglobin', name: 'Hemoglobin (Hb)', ...patient.blood_workup.cbc?.hemoglobin },
                    { key: 'wbc_count', name: 'Total WBC', ...patient.blood_workup.cbc?.wbc_count },
                    { key: 'platelets', name: 'Platelets', ...patient.blood_workup.cbc?.platelets },
                    { key: 'rbc_count', name: 'RBC Count', ...patient.blood_workup.cbc?.rbc_count },
                    { key: 'neutrophils', name: 'Neutrophils', ...patient.blood_workup.cbc?.neutrophils },
                    { key: 'lymphocytes', name: 'Lymphocytes', ...patient.blood_workup.cbc?.lymphocytes },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <span className="text-slate-600 block">{item.name}</span>
                        <span className="text-[10px] text-slate-400">Ref: {item.ref_range || 'N/A'}</span>
                      </div>
                      <div className="text-right">
                        <strong className="text-slate-900 font-mono">
                          {item.value !== null && item.value !== undefined ? `${item.value} ${item.unit || ''}` : 'Not Tested'}
                        </strong>
                        <span className={`block text-[10px] font-semibold ${
                          item.status === 'Normal' ? 'text-emerald-600' : item.status === 'Low' ? 'text-amber-600' : item.status === 'High' ? 'text-rose-600' : 'text-slate-400'
                        }`}>
                          {item.status || 'Not Tested'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* LFT Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-800">Liver Function Test (LFT)</span>
                  <span className="text-[10px] text-slate-400">Hepatic</span>
                </div>
                <div className="space-y-2 text-xs">
                  {[
                    { key: 'total_bilirubin', name: 'Total Bilirubin', ...patient.blood_workup.lft?.total_bilirubin },
                    { key: 'direct_bilirubin', name: 'Direct Bilirubin', ...patient.blood_workup.lft?.direct_bilirubin },
                    { key: 'ast_sgot', name: 'AST (SGOT)', ...patient.blood_workup.lft?.ast_sgot },
                    { key: 'alt_sgpt', name: 'ALT (SGPT)', ...patient.blood_workup.lft?.alt_sgpt },
                    { key: 'alp', name: 'Alk. Phosphatase', ...patient.blood_workup.lft?.alp },
                    { key: 'albumin', name: 'Serum Albumin', ...patient.blood_workup.lft?.albumin },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <span className="text-slate-600 block">{item.name}</span>
                        <span className="text-[10px] text-slate-400">Ref: {item.ref_range || 'N/A'}</span>
                      </div>
                      <div className="text-right">
                        <strong className="text-slate-900 font-mono">
                          {item.value !== null && item.value !== undefined ? `${item.value} ${item.unit || ''}` : 'Not Tested'}
                        </strong>
                        <span className={`block text-[10px] font-semibold ${
                          item.status === 'Normal' ? 'text-emerald-600' : item.status === 'Low' ? 'text-amber-600' : item.status === 'High' ? 'text-rose-600' : 'text-slate-400'
                        }`}>
                          {item.status || 'Not Tested'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RFT Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-800">Renal Function Test (RFT)</span>
                  <span className="text-[10px] text-slate-400">Renal</span>
                </div>
                <div className="space-y-2 text-xs">
                  {[
                    { key: 'bun', name: 'Blood Urea Nitrogen', ...patient.blood_workup.rft?.bun },
                    { key: 'serum_creatinine', name: 'Serum Creatinine', ...patient.blood_workup.rft?.serum_creatinine },
                    { key: 'egfr', name: 'eGFR (CKD-EPI)', ...patient.blood_workup.rft?.egfr },
                    { key: 'uric_acid', name: 'Serum Uric Acid', ...patient.blood_workup.rft?.uric_acid },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <span className="text-slate-600 block">{item.name}</span>
                        <span className="text-[10px] text-slate-400">Ref: {item.ref_range || 'N/A'}</span>
                      </div>
                      <div className="text-right">
                        <strong className="text-slate-900 font-mono">
                          {item.value !== null && item.value !== undefined ? `${item.value} ${item.unit || ''}` : 'Not Tested'}
                        </strong>
                        <span className={`block text-[10px] font-semibold ${
                          item.status === 'Normal' ? 'text-emerald-600' : item.status === 'Low' ? 'text-amber-600' : item.status === 'High' ? 'text-rose-600' : 'text-slate-400'
                        }`}>
                          {item.status || 'Not Tested'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Electrolytes Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-800">Serum Electrolytes</span>
                  <span className="text-[10px] text-slate-400">Electrolytes</span>
                </div>
                <div className="space-y-2 text-xs">
                  {[
                    { key: 'sodium', name: 'Sodium (Na⁺)', ...patient.blood_workup.electrolytes?.sodium },
                    { key: 'potassium', name: 'Potassium (K⁺)', ...patient.blood_workup.electrolytes?.potassium },
                    { key: 'chloride', name: 'Chloride (Cl⁻)', ...patient.blood_workup.electrolytes?.chloride },
                    { key: 'bicarbonate', name: 'Bicarbonate (HCO₃⁻)', ...patient.blood_workup.electrolytes?.bicarbonate },
                    { key: 'calcium', name: 'Calcium (Ca²⁺)', ...patient.blood_workup.electrolytes?.calcium },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <span className="text-slate-600 block">{item.name}</span>
                        <span className="text-[10px] text-slate-400">Ref: {item.ref_range || 'N/A'}</span>
                      </div>
                      <div className="text-right">
                        <strong className="text-slate-900 font-mono">
                          {item.value !== null && item.value !== undefined ? `${item.value} ${item.unit || ''}` : 'Not Tested'}
                        </strong>
                        <span className={`block text-[10px] font-semibold ${
                          item.status === 'Normal' ? 'text-emerald-600' : item.status === 'Low' ? 'text-amber-600' : item.status === 'High' ? 'text-rose-600' : 'text-slate-400'
                        }`}>
                          {item.status || 'Not Tested'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {patient.blood_workup.report_notes && (
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
                <FileText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Pathologist & Laboratory Clinical Remarks:</strong> {patient.blood_workup.report_notes}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
            <FlaskConical className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="text-xs font-semibold text-slate-700">No Blood Workup Recorded for This Patient</div>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto">
              Per healthcare governance standards, unentered laboratory investigations are recorded as <em>Not Tested</em> and are <strong>never assumed normal</strong>. No clinical conclusions will be inferred from absent lab values.
            </p>
          </div>
        )}
      </div>

      {/* SECTION G & H: STATISTICAL COMPARISON & COMPLETENESS AUDIT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION G: Statistical Comparison */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-600" /> Section G: Cohort Statistical Baseline
            </h3>
            <span className="text-[10px] text-gray-400">NSCLC Reference Benchmarks</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
                <tr>
                  <th className="py-2 px-3">Metric</th>
                  <th className="py-2 px-3">Current Patient</th>
                  <th className="py-2 px-3">Cohort Benchmark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-2 px-3 font-medium text-gray-700">Patient Age</td>
                  <td className="py-2 px-3 font-bold text-blue-700">{patient.age} yrs</td>
                  <td className="py-2 px-3 text-gray-500 font-mono">Mean: 67.8 yrs (Median: 67.0)</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium text-gray-700">Stage Group</td>
                  <td className="py-2 px-3 font-bold text-blue-700">Stage {patient.overall_stage}</td>
                  <td className="py-2 px-3 text-gray-500">Stage I (22%), II (9.5%), III (68.5%)</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium text-gray-700">Histology</td>
                  <td className="py-2 px-3 font-bold capitalize text-blue-700">{patient.histology}</td>
                  <td className="py-2 px-3 text-gray-500">Squamous (36%), Large Cell (27%), Adeno (12%)</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium text-gray-700">EGFR Rate</td>
                  <td className="py-2 px-3 font-bold text-blue-700">{patient.egfr_status}</td>
                  <td className="py-2 px-3 text-gray-500 font-mono">18.5% Positive in Radiogenomics</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION H: Missing Clinical Information & Completeness Score */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-600" /> Section H: Clinical Completeness Audit
            </h3>
            <span className="text-xs font-bold font-mono text-blue-700">{completenessPct}% Complete</span>
          </div>

          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                completenessPct > 80 ? 'bg-emerald-500' : completenessPct > 60 ? 'bg-blue-500' : 'bg-amber-500'
              }`}
              style={{ width: `${completenessPct}%` }}
            />
          </div>

          <ul className="grid grid-cols-2 gap-2 text-[11px] pt-1">
            {criticalFields.map((f, i) => (
              <li key={i} className="flex items-center gap-1.5">
                {f.val ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                )}
                <span className={f.val ? 'text-gray-700' : 'text-amber-800 font-semibold'}>
                  {f.label}: {f.val ? 'Documented' : 'Missing / Unspecified'}
                </span>
              </li>
            ))}
          </ul>

          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[10px] text-amber-800">
            <strong>Impact on Decision Support:</strong> Complete staging and biomarker data are required to provide verified guideline matching. Incomplete records will restrict therapeutic pathway recommendation confidence.
          </div>
        </div>
      </div>
    </div>
  );
}
