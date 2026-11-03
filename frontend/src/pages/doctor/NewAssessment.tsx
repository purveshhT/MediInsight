import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus, AlertCircle, CheckCircle2, ChevronRight, Activity, Scan,
  Upload, FileText, X, Image as ImageIcon, Check, Save, Info, AlertTriangle,
  FlaskConical, HeartPulse, Droplets, Stethoscope, Briefcase, MapPin, User
} from 'lucide-react';
import { createAssessment, uploadAssessmentImage } from '../../services/api';

const OCCUPATION_SUGGESTIONS = [
  'Retired',
  'Civil Engineer',
  'Software Engineer',
  'Healthcare Worker / Nurse / Physician',
  'Teacher / Professor',
  'Accountant / Financial Analyst',
  'Office Administrator',
  'Construction / Carpenter / Electrician',
  'Agricultural / Farmer',
  'Transportation / Commercial Driver',
  'Manufacturing / Factory Worker',
  'Self-employed / Business Owner',
  'Other / Unspecified',
];

export function NewAssessment() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const labFileInputRef = useRef<HTMLInputElement>(null);

  const [activeStep, setActiveStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state spanning all sections
  const [formData, setFormData] = useState({
    // Section A: Demographics
    patient_name: '',
    age: 65,
    gender: 'male',
    occupation: 'Retired',
    address: '452 Elm Street, Suite 4B, Cambridge, MA 02138',
    smoking_history: 'Former Smoker',
    smoking_pack_years: 30,
    weight: 168,
    medical_history: 'Hypertension controlled with ACE inhibitor. No prior malignancies.',
    comorbidities: 'Essential Hypertension, Mild Hyperlipidemia',

    // Section B: Histopathology
    cancer_type: 'Non-Small Cell Lung Cancer',
    histology: 'adenocarcinoma',

    // Section C: Cancer Staging
    overall_stage: 'IIIa',
    clinical_stage: 'cT2aN2M0',
    pathological_stage: 'Pending Surgical Review',
    t_stage: '2',
    n_stage: '2',
    m_stage: '0',
    performance_status: 'ECOG 1',

    // Section D: Molecular Biomarkers
    egfr_status: 'Positive',
    kras_status: 'Negative',
    alk_status: 'Negative',
    other_biomarkers: 'PD-L1 Tumor Proportion Score: 30%',

    // Treatment & notes
    chemotherapy: 'No',
    radiation: 'No',
    notes: 'Patient presented with intermittent hemoptysis and dyspnea on exertion. Solitary mass in right lower lobe.',
    research_sample_id: null,
    research_split: 'test',
    assessment_status: 'completed',
  });

  // Section E: Blood Workup State
  const [activeLabTab, setActiveLabTab] = useState<'cbc' | 'lft' | 'rft' | 'electrolytes'>('cbc');
  const [bloodWorkup, setBloodWorkup] = useState({
    cbc: {
      hemoglobin: '14.1',
      wbc_count: '7.2',
      platelets: '245',
      rbc_count: '4.8',
      neutrophils: '62.0',
      lymphocytes: '28.0',
    },
    lft: {
      total_bilirubin: '0.8',
      direct_bilirubin: '0.2',
      ast_sgot: '24',
      alt_sgpt: '28',
      alp: '85',
      total_protein: '7.1',
      albumin: '4.2',
    },
    rft: {
      bun: '14.0',
      serum_creatinine: '0.9',
      egfr: '91.0',
      uric_acid: '5.4',
    },
    electrolytes: {
      sodium: '140.0',
      potassium: '4.2',
      chloride: '101.0',
      bicarbonate: '25.0',
      calcium: '9.4',
    },
    report_notes: 'All hematological and metabolic parameters within acceptable pre-operative baseline limits.',
  });

  // Section F: Uploaded Image State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [imageMetadata, setImageMetadata] = useState<{
    name: string;
    size: string;
    format: string;
    dimensions: string;
  } | null>(null);

  // Lab report attachment
  const [labReportFile, setLabReportFile] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'age' || name === 'smoking_pack_years' || name === 'weight' || name === 'research_sample_id')
        ? (value === '' ? null : Number(value))
        : value,
    }));
  };

  const handleLabChange = (category: 'cbc' | 'lft' | 'rft' | 'electrolytes', field: string, val: string) => {
    setBloodWorkup(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: val,
      },
    }));
  };

  // Helper to compute parameter status
  const evaluateParam = (valStr: string, low: number, high: number): { label: string; color: string } => {
    if (!valStr || valStr.trim() === '') return { label: 'Not Tested', color: 'bg-slate-100 text-slate-500' };
    const num = parseFloat(valStr);
    if (isNaN(num)) return { label: 'Not Tested', color: 'bg-slate-100 text-slate-500' };
    if (num < low) return { label: 'Low', color: 'bg-amber-100 text-amber-800 border border-amber-200' };
    if (num > high) return { label: 'High', color: 'bg-rose-100 text-rose-800 border border-rose-200' };
    return { label: 'Normal', color: 'bg-emerald-100 text-emerald-800 border border-emerald-200' };
  };

  // Image Upload Handling
  const processSelectedFile = (file: File) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.dcm', '.nii', '.tiff', '.bmp', '.pdf'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowed.includes(ext)) {
      setError(`Unsupported file format '${ext}'. Allowed: PNG, JPG, JPEG, DICOM, NIfTI, TIFF, BMP, PDF`);
      return;
    }

    if (file.size > 30 * 1024 * 1024) {
      setError('File size exceeds the 30MB maximum limit.');
      return;
    }

    setError(null);
    setUploadedFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        setImagePreviewUrl(url);

        const img = new Image();
        img.onload = () => {
          setImageMetadata({
            name: file.name,
            size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
            format: ext.toUpperCase().replace('.', ''),
            dimensions: `${img.width} × ${img.height} px`,
          });
        };
        img.src = url;
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreviewUrl(null);
      setImageMetadata({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        format: ext.toUpperCase().replace('.', ''),
        dimensions: ext === '.pdf' ? 'Laboratory Document (PDF)' : 'Volumetric/DICOM Scan',
      });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const removeImage = () => {
    setUploadedFile(null);
    setImagePreviewUrl(null);
    setImageMetadata(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Build structured blood workup object for persistence
  const buildStructuredBloodWorkup = () => {
    const parseField = (val: string, unit: string, ref_range: string, low: number, high: number) => {
      const num = val && val.trim() !== '' ? parseFloat(val) : null;
      const status = num !== null ? (num < low ? 'Low' : num > high ? 'High' : 'Normal') : 'Not Tested';
      return { value: num, unit, ref_range, status };
    };

    return {
      cbc: {
        hemoglobin: parseField(bloodWorkup.cbc.hemoglobin, 'g/dL', '12.0 - 17.5', 12.0, 17.5),
        wbc_count: parseField(bloodWorkup.cbc.wbc_count, '10^3/µL', '4.5 - 11.0', 4.5, 11.0),
        platelets: parseField(bloodWorkup.cbc.platelets, '10^3/µL', '150 - 450', 150, 450),
        rbc_count: parseField(bloodWorkup.cbc.rbc_count, '10^6/µL', '4.0 - 5.9', 4.0, 5.9),
        neutrophils: parseField(bloodWorkup.cbc.neutrophils, '%', '40.0 - 75.0', 40.0, 75.0),
        lymphocytes: parseField(bloodWorkup.cbc.lymphocytes, '%', '20.0 - 45.0', 20.0, 45.0),
      },
      lft: {
        total_bilirubin: parseField(bloodWorkup.lft.total_bilirubin, 'mg/dL', '0.2 - 1.2', 0.2, 1.2),
        direct_bilirubin: parseField(bloodWorkup.lft.direct_bilirubin, 'mg/dL', '0.0 - 0.3', 0.0, 0.3),
        ast_sgot: parseField(bloodWorkup.lft.ast_sgot, 'U/L', '10 - 40', 10, 40),
        alt_sgpt: parseField(bloodWorkup.lft.alt_sgpt, 'U/L', '7 - 56', 7, 56),
        alp: parseField(bloodWorkup.lft.alp, 'U/L', '44 - 147', 44, 147),
        total_protein: parseField(bloodWorkup.lft.total_protein, 'g/dL', '6.0 - 8.3', 6.0, 8.3),
        albumin: parseField(bloodWorkup.lft.albumin, 'g/dL', '3.5 - 5.0', 3.5, 5.0),
      },
      rft: {
        bun: parseField(bloodWorkup.rft.bun, 'mg/dL', '7.0 - 20.0', 7.0, 20.0),
        serum_creatinine: parseField(bloodWorkup.rft.serum_creatinine, 'mg/dL', '0.6 - 1.3', 0.6, 1.3),
        egfr: parseField(bloodWorkup.rft.egfr, 'mL/min/1.73m²', '>= 60.0', 60.0, 150.0),
        uric_acid: parseField(bloodWorkup.rft.uric_acid, 'mg/dL', '3.5 - 7.2', 3.5, 7.2),
      },
      electrolytes: {
        sodium: parseField(bloodWorkup.electrolytes.sodium, 'mEq/L', '135 - 145', 135.0, 145.0),
        potassium: parseField(bloodWorkup.electrolytes.potassium, 'mEq/L', '3.5 - 5.0', 3.5, 5.0),
        chloride: parseField(bloodWorkup.electrolytes.chloride, 'mEq/L', '96 - 106', 96.0, 106.0),
        bicarbonate: parseField(bloodWorkup.electrolytes.bicarbonate, 'mEq/L', '22 - 29', 22.0, 29.0),
        calcium: parseField(bloodWorkup.electrolytes.calcium, 'mg/dL', '8.5 - 10.5', 8.5, 10.5),
      },
      report_notes: bloodWorkup.report_notes,
      report_file: labReportFile ? labReportFile.name : null,
    };
  };

  const handleStepClick = (targetStep: number) => {
    if (activeStep === 1 && targetStep > 1) {
      if (!formData.patient_name || formData.patient_name.trim() === '') {
        setError('Patient Name is required before proceeding to the next section.');
        return;
      }
    }
    setError(null);
    setActiveStep(targetStep);
  };

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!formData.patient_name || formData.patient_name.trim() === '') {
      setError('Patient Name is required to save the assessment. Please enter the patient name.');
      setActiveStep(1);
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        blood_workup: buildStructuredBloodWorkup(),
        assessment_status: isDraft ? 'draft' : 'completed',
      };

      // 1. Create Assessment Record in SQLite
      const res = await createAssessment(payload);
      const assessmentId = res.data.assessment_id;

      // 2. Upload medical image or lab report scan if provided
      if (uploadedFile) {
        try {
          await uploadAssessmentImage(assessmentId, uploadedFile);
        } catch (uploadErr: any) {
          console.warn('Image upload error:', uploadErr);
        }
      }

      if (labReportFile) {
        try {
          await uploadAssessmentImage(assessmentId, labReportFile);
        } catch (labErr: any) {
          console.warn('Lab report upload error:', labErr);
        }
      }

      setSuccess(`Assessment ${assessmentId} successfully saved to SQLite database.`);

      // 3. Navigate to Clinical Analysis
      setTimeout(() => {
        navigate('/doctor/clinical-analysis', {
          state: {
            assessmentId,
            assessment: res.data.assessment,
            similarCases: res.data.similar_cases,
            recommendations: res.data.recommendations
          }
        });
      }, 1000);

    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || 'Failed to submit patient assessment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Title & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">New Patient Assessment</h1>
          <p className="text-gray-500 text-sm mt-1">
            Multimodal clinical intake wizard with demographics, staging, biomarkers, blood workup, and imaging.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={loading}
            className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Save className="w-3.5 h-3.5 text-gray-500" />
            <span>Save Draft</span>
          </button>
        </div>
      </div>

      {/* 6-Step Clinical Progress Ribbon */}
      <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between text-xs select-none gap-2">
        {[
          { step: 1, label: 'Demographics' },
          { step: 2, label: 'Histopathology' },
          { step: 3, label: 'Cancer Staging' },
          { step: 4, label: 'Biomarkers' },
          { step: 5, label: 'Blood Workup' },
          { step: 6, label: 'Medical Imaging' },
        ].map((item, idx) => (
          <React.Fragment key={item.step}>
            <div
              onClick={() => handleStepClick(item.step)}
              className={`flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg transition-all ${
                activeStep === item.step
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                activeStep === item.step ? 'bg-white text-blue-600' : 'bg-gray-200 text-gray-700'
              }`}>
                {item.step}
              </span>
              <span>{item.label}</span>
            </div>
            {idx < 5 && <ChevronRight className="w-3.5 h-3.5 text-gray-300 hidden md:block shrink-0" />}
          </React.Fragment>
        ))}
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        
        {/* SECTION A: PATIENT DEMOGRAPHICS */}
        {activeStep === 1 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">1</span>
                <h2 className="text-sm font-bold text-gray-800">Section 1: Patient Demographics & Baseline Health</h2>
              </div>
              <span className="text-[11px] text-gray-400">Step 1 of 6</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Patient Full Name Field (Required) */}
              <div className="md:col-span-4 bg-blue-50/40 p-4 rounded-xl border border-blue-200">
                <label className="block text-xs font-bold text-gray-900 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Patient Full Name *</span>
                  </span>
                  <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">Required Field</span>
                </label>
                <input
                  type="text"
                  name="patient_name"
                  placeholder="e.g. Rahul Sharma, Priya Patil, Amit Shah"
                  value={formData.patient_name}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-blue-300 rounded-lg text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
                <span className="text-[11px] text-gray-500 mt-1 block">
                  Patient name serves as the primary case identifier across clinical summaries, recommendations, reports, and history.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Age (Years) *</label>
                <input
                  type="number"
                  name="age"
                  min="18"
                  max="105"
                  value={formData.age}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Gender *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              {/* Occupation Field */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                  <span>Occupation</span>
                </label>
                <input
                  type="text"
                  name="occupation"
                  list="occupation-list"
                  placeholder="e.g. Civil Engineer, Teacher, Retired"
                  value={formData.occupation}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                />
                <datalist id="occupation-list">
                  {OCCUPATION_SUGGESTIONS.map(occ => (
                    <option key={occ} value={occ} />
                  ))}
                </datalist>
                <span className="text-[10px] text-gray-400 mt-0.5 block">Relevant for occupational exposure evaluation</span>
              </div>

              {/* Address Field (Multiline) */}
              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>Residential Address</span>
                </label>
                <textarea
                  name="address"
                  rows={2}
                  placeholder="Street address, apartment, city, state, postal code"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Smoking History</label>
                <select
                  name="smoking_history"
                  value={formData.smoking_history}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Nonsmoker">Nonsmoker (&lt;100 lifetime cigs)</option>
                  <option value="Former Smoker">Former Smoker (Quit &gt;1 year)</option>
                  <option value="Current Smoker">Current Active Smoker</option>
                  <option value="Unknown">Unknown / Not Documented</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Pack Years / Weight (lbs)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    name="smoking_pack_years"
                    placeholder="Packs"
                    value={formData.smoking_pack_years ?? ''}
                    onChange={handleChange}
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg text-xs font-mono"
                  />
                  <input
                    type="number"
                    name="weight"
                    placeholder="Lbs"
                    value={formData.weight ?? ''}
                    onChange={handleChange}
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Medical History & Prior Interventions</label>
                <input
                  type="text"
                  name="medical_history"
                  value={formData.medical_history}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Known Comorbidities</label>
                <input
                  type="text"
                  name="comorbidities"
                  placeholder="e.g. Hypertension, COPD, Type 2 Diabetes"
                  value={formData.comorbidities}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => handleStepClick(2)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <span>Continue to Histopathology</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SECTION B: HISTOPATHOLOGY */}
        {activeStep === 2 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">2</span>
                <h2 className="text-sm font-bold text-gray-800">Section 2: Histopathological Classification</h2>
              </div>
              <span className="text-[11px] text-gray-400">Step 2 of 6</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Primary Malignancy Category</label>
                <input
                  type="text"
                  name="cancer_type"
                  value={formData.cancer_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Histological Subtype *</label>
                <select
                  name="histology"
                  value={formData.histology}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500"
                >
                  <option value="adenocarcinoma">Adenocarcinoma (Glandular Differentiation)</option>
                  <option value="squamous cell carcinoma">Squamous Cell Carcinoma (Keratinizing)</option>
                  <option value="large cell">Large Cell Carcinoma (Undifferentiated)</option>
                  <option value="nos">Non-Small Cell Carcinoma, NOS</option>
                  <option value="other">Other Histology / Sarcomatoid</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <span>Continue to Cancer Staging</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SECTION C: CANCER STAGING */}
        {activeStep === 3 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">3</span>
                <h2 className="text-sm font-bold text-gray-800">Section 3: AJCC 8th Edition TNM Staging</h2>
              </div>
              <span className="text-[11px] text-gray-400">Step 3 of 6</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">T Stage (Primary Tumor)</label>
                <select
                  name="t_stage"
                  value={formData.t_stage}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono"
                >
                  <option value="1">T1 (&le;3cm)</option>
                  <option value="2">T2 (&gt;3cm - 5cm)</option>
                  <option value="3">T3 (&gt;5cm - 7cm / Invasion)</option>
                  <option value="4">T4 (&gt;7cm / Mediastinal / Spine)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">N Stage (Lymph Nodes)</label>
                <select
                  name="n_stage"
                  value={formData.n_stage}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono"
                >
                  <option value="0">N0 (No regional nodes)</option>
                  <option value="1">N1 (Ipsilateral peribronchial/hilar)</option>
                  <option value="2">N2 (Ipsilateral mediastinal/subcarinal)</option>
                  <option value="3">N3 (Contralateral hilar/mediastinal/scalene)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">M Stage (Metastasis)</label>
                <select
                  name="m_stage"
                  value={formData.m_stage}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono"
                >
                  <option value="0">M0 (No distant metastasis)</option>
                  <option value="1">M1 (Distant pleural/pericardial/organ)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Overall Stage Group *</label>
                <select
                  name="overall_stage"
                  value={formData.overall_stage}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-blue-400 bg-blue-50/50 rounded-lg text-xs font-bold text-blue-900"
                >
                  <option value="I">Stage I (Localized, Node-Negative)</option>
                  <option value="II">Stage II (Involved Hilar Nodes / T2b)</option>
                  <option value="IIIa">Stage IIIa (Mediastinal Nodes / Locally Advanced)</option>
                  <option value="IIIb">Stage IIIb (Extensive Mediastinal / Contralateral)</option>
                  <option value="IV">Stage IV (Metastatic Disease)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Clinical Staging Description</label>
                <input
                  type="text"
                  name="clinical_stage"
                  value={formData.clinical_stage}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">ECOG Performance Status</label>
                <select
                  name="performance_status"
                  value={formData.performance_status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                >
                  <option value="ECOG 0">ECOG 0 (Fully active, no performance restrictions)</option>
                  <option value="ECOG 1">ECOG 1 (Restricted in physically strenuous activity)</option>
                  <option value="ECOG 2">ECOG 2 (Ambulatory, capable of all self-care)</option>
                  <option value="ECOG 3">ECOG 3 (Capable of only limited self-care)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(4)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <span>Continue to Biomarkers</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SECTION D: MOLECULAR BIOMARKERS */}
        {activeStep === 4 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">4</span>
                <h2 className="text-sm font-bold text-gray-800">Section 4: Molecular Biomarkers & Targetable Mutations</h2>
              </div>
              <span className="text-[11px] text-gray-400">Step 4 of 6</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">EGFR Mutation Status</label>
                <select
                  name="egfr_status"
                  value={formData.egfr_status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium"
                >
                  <option value="Positive">Positive (Exon 19 del / L858R)</option>
                  <option value="Negative">Negative (Wild-Type)</option>
                  <option value="Unknown">Unknown / Pending NGS</option>
                  <option value="Not Tested">Not Tested</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">KRAS Mutation Status</label>
                <select
                  name="kras_status"
                  value={formData.kras_status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium"
                >
                  <option value="Positive">Positive (G12C / G12D / G12V)</option>
                  <option value="Negative">Negative (Wild-Type)</option>
                  <option value="Unknown">Unknown</option>
                  <option value="Not Tested">Not Tested</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">ALK Translocation Status</label>
                <select
                  name="alk_status"
                  value={formData.alk_status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium"
                >
                  <option value="Positive">Positive (EML4-ALK Fusion)</option>
                  <option value="Negative">Negative (Non-rearranged)</option>
                  <option value="Unknown">Unknown</option>
                  <option value="Not Tested">Not Tested</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Additional Biomarkers / PD-L1 TPS / ROS1 / BRAF</label>
                <input
                  type="text"
                  name="other_biomarkers"
                  value={formData.other_biomarkers}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(5)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <span>Continue to Blood Workup</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SECTION E: BLOOD WORKUP / LABORATORY INVESTIGATIONS (NEW) */}
        {activeStep === 5 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-bold">5</span>
                <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-rose-600" />
                  <span>Section 5: Blood Workup / Laboratory Investigations</span>
                </h2>
              </div>
              <span className="text-[11px] text-gray-400">Step 5 of 6</span>
            </div>

            {/* Governance disclaimer for missing lab values */}
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Clinical Laboratory Governance:</strong> Individual values are matched against adult standard clinical reference ranges. Unentered or pending tests are recorded as <em>Not Tested</em> and are <strong>never automatically assumed normal</strong>. No clinical conclusions will be drawn from omitted results.
              </div>
            </div>

            {/* Sub-tabs for the 4 Investigation Panels */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold gap-1">
              {[
                { id: 'cbc', label: 'Complete Blood Count (CBC)' },
                { id: 'lft', label: 'Liver Function Test (LFT)' },
                { id: 'rft', label: 'Renal Function Test (RFT)' },
                { id: 'electrolytes', label: 'Serum Electrolytes' },
              ].map(tab => (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setActiveLabTab(tab.id as any)}
                  className={`flex-1 py-1.5 px-3 rounded-lg transition-all text-center ${
                    activeLabTab === tab.id
                      ? 'bg-white text-rose-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB 1: CBC */}
            {activeLabTab === 'cbc' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Hemoglobin */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-800">Hemoglobin (Hb)</label>
                      <span className={`text-[10px] px-2 py-0.2 rounded font-semibold ${evaluateParam(bloodWorkup.cbc.hemoglobin, 12.0, 17.5).color}`}>
                        {evaluateParam(bloodWorkup.cbc.hemoglobin, 12.0, 17.5).label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="14.2"
                        value={bloodWorkup.cbc.hemoglobin}
                        onChange={(e) => handleLabChange('cbc', 'hemoglobin', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold"
                      />
                      <span className="text-[11px] text-slate-500 shrink-0 font-medium">g/dL</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Ref: 12.0 – 17.5 g/dL</div>
                  </div>

                  {/* Total WBC */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-800">Total WBC Count</label>
                      <span className={`text-[10px] px-2 py-0.2 rounded font-semibold ${evaluateParam(bloodWorkup.cbc.wbc_count, 4.5, 11.0).color}`}>
                        {evaluateParam(bloodWorkup.cbc.wbc_count, 4.5, 11.0).label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="7.2"
                        value={bloodWorkup.cbc.wbc_count}
                        onChange={(e) => handleLabChange('cbc', 'wbc_count', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold"
                      />
                      <span className="text-[11px] text-slate-500 shrink-0 font-medium">10³/µL</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Ref: 4.5 – 11.0 ×10³/µL</div>
                  </div>

                  {/* Platelet Count */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-800">Platelet Count</label>
                      <span className={`text-[10px] px-2 py-0.2 rounded font-semibold ${evaluateParam(bloodWorkup.cbc.platelets, 150, 450).color}`}>
                        {evaluateParam(bloodWorkup.cbc.platelets, 150, 450).label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="245"
                        value={bloodWorkup.cbc.platelets}
                        onChange={(e) => handleLabChange('cbc', 'platelets', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold"
                      />
                      <span className="text-[11px] text-slate-500 shrink-0 font-medium">10³/µL</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Ref: 150 – 450 ×10³/µL</div>
                  </div>

                  {/* RBC Count */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-800">RBC Count</label>
                      <span className={`text-[10px] px-2 py-0.2 rounded font-semibold ${evaluateParam(bloodWorkup.cbc.rbc_count, 4.0, 5.9).color}`}>
                        {evaluateParam(bloodWorkup.cbc.rbc_count, 4.0, 5.9).label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="4.8"
                        value={bloodWorkup.cbc.rbc_count}
                        onChange={(e) => handleLabChange('cbc', 'rbc_count', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold"
                      />
                      <span className="text-[11px] text-slate-500 shrink-0 font-medium">10⁶/µL</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Ref: 4.0 – 5.9 ×10⁶/µL</div>
                  </div>

                  {/* Neutrophils % */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-800">Neutrophils</label>
                      <span className={`text-[10px] px-2 py-0.2 rounded font-semibold ${evaluateParam(bloodWorkup.cbc.neutrophils, 40.0, 75.0).color}`}>
                        {evaluateParam(bloodWorkup.cbc.neutrophils, 40.0, 75.0).label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.5"
                        placeholder="62.0"
                        value={bloodWorkup.cbc.neutrophils}
                        onChange={(e) => handleLabChange('cbc', 'neutrophils', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold"
                      />
                      <span className="text-[11px] text-slate-500 shrink-0 font-medium">%</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Ref: 40.0 – 75.0 %</div>
                  </div>

                  {/* Lymphocytes % */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-800">Lymphocytes</label>
                      <span className={`text-[10px] px-2 py-0.2 rounded font-semibold ${evaluateParam(bloodWorkup.cbc.lymphocytes, 20.0, 45.0).color}`}>
                        {evaluateParam(bloodWorkup.cbc.lymphocytes, 20.0, 45.0).label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.5"
                        placeholder="28.0"
                        value={bloodWorkup.cbc.lymphocytes}
                        onChange={(e) => handleLabChange('cbc', 'lymphocytes', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold"
                      />
                      <span className="text-[11px] text-slate-500 shrink-0 font-medium">%</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Ref: 20.0 – 45.0 %</div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: LFT */}
            {activeLabTab === 'lft' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Total Bilirubin */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-800">Total Bilirubin</label>
                      <span className={`text-[10px] px-2 py-0.2 rounded font-semibold ${evaluateParam(bloodWorkup.lft.total_bilirubin, 0.2, 1.2).color}`}>
                        {evaluateParam(bloodWorkup.lft.total_bilirubin, 0.2, 1.2).label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="0.8"
                        value={bloodWorkup.lft.total_bilirubin}
                        onChange={(e) => handleLabChange('lft', 'total_bilirubin', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold"
                      />
                      <span className="text-[11px] text-slate-500 shrink-0 font-medium">mg/dL</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Ref: 0.2 – 1.2 mg/dL</div>
                  </div>

                  {/* Direct Bilirubin */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-800">Direct Bilirubin</label>
                      <span className={`text-[10px] px-2 py-0.2 rounded font-semibold ${evaluateParam(bloodWorkup.lft.direct_bilirubin, 0.0, 0.3).color}`}>
                        {evaluateParam(bloodWorkup.lft.direct_bilirubin, 0.0, 0.3).label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.05"
                        placeholder="0.2"
                        value={bloodWorkup.lft.direct_bilirubin}
                        onChange={(e) => handleLabChange('lft', 'direct_bilirubin', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold"
                      />
                      <span className="text-[11px] text-slate-500 shrink-0 font-medium">mg/dL</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Ref: 0.0 – 0.3 mg/dL</div>
                  </div>

                  {/* AST (SGOT) */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-800">AST (SGOT)</label>
                      <span className={`text-[10px] px-2 py-0.2 rounded font-semibold ${evaluateParam(bloodWorkup.lft.ast_sgot, 10, 40).color}`}>
                        {evaluateParam(bloodWorkup.lft.ast_sgot, 10, 40).label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="24"
                        value={bloodWorkup.lft.ast_sgot}
                        onChange={(e) => handleLabChange('lft', 'ast_sgot', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold"
                      />
                      <span className="text-[11px] text-slate-500 shrink-0 font-medium">U/L</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Ref: 10 – 40 U/L</div>
                  </div>

                  {/* ALT (SGPT) */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-800">ALT (SGPT)</label>
                      <span className={`text-[10px] px-2 py-0.2 rounded font-semibold ${evaluateParam(bloodWorkup.lft.alt_sgpt, 7, 56).color}`}>
                        {evaluateParam(bloodWorkup.lft.alt_sgpt, 7, 56).label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="28"
                        value={bloodWorkup.lft.alt_sgpt}
                        onChange={(e) => handleLabChange('lft', 'alt_sgpt', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold"
                      />
                      <span className="text-[11px] text-slate-500 shrink-0 font-medium">U/L</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Ref: 7 – 56 U/L</div>
                  </div>

                  {/* Alkaline Phosphatase */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-800">Alkaline Phosphatase (ALP)</label>
                      <span className={`text-[10px] px-2 py-0.2 rounded font-semibold ${evaluateParam(bloodWorkup.lft.alp, 44, 147).color}`}>
                        {evaluateParam(bloodWorkup.lft.alp, 44, 147).label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="85"
                        value={bloodWorkup.lft.alp}
                        onChange={(e) => handleLabChange('lft', 'alp', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold"
                      />
                      <span className="text-[11px] text-slate-500 shrink-0 font-medium">U/L</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Ref: 44 – 147 U/L</div>
                  </div>

                  {/* Albumin */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-800">Serum Albumin</label>
                      <span className={`text-[10px] px-2 py-0.2 rounded font-semibold ${evaluateParam(bloodWorkup.lft.albumin, 3.5, 5.0).color}`}>
                        {evaluateParam(bloodWorkup.lft.albumin, 3.5, 5.0).label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="4.2"
                        value={bloodWorkup.lft.albumin}
                        onChange={(e) => handleLabChange('lft', 'albumin', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold"
                      />
                      <span className="text-[11px] text-slate-500 shrink-0 font-medium">g/dL</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Ref: 3.5 – 5.0 g/dL</div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: RFT */}
            {activeLabTab === 'rft' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* BUN */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-800">Blood Urea Nitrogen (BUN)</label>
                      <span className={`text-[10px] px-2 py-0.2 rounded font-semibold ${evaluateParam(bloodWorkup.rft.bun, 7.0, 20.0).color}`}>
                        {evaluateParam(bloodWorkup.rft.bun, 7.0, 20.0).label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.5"
                        placeholder="14.0"
                        value={bloodWorkup.rft.bun}
                        onChange={(e) => handleLabChange('rft', 'bun', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold"
                      />
                      <span className="text-[11px] text-slate-500 shrink-0 font-medium">mg/dL</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Ref: 7.0 – 20.0 mg/dL</div>
                  </div>

                  {/* Creatinine */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-800">Serum Creatinine</label>
                      <span className={`text-[10px] px-2 py-0.2 rounded font-semibold ${evaluateParam(bloodWorkup.rft.serum_creatinine, 0.6, 1.3).color}`}>
                        {evaluateParam(bloodWorkup.rft.serum_creatinine, 0.6, 1.3).label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.05"
                        placeholder="0.9"
                        value={bloodWorkup.rft.serum_creatinine}
                        onChange={(e) => handleLabChange('rft', 'serum_creatinine', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold"
                      />
                      <span className="text-[11px] text-slate-500 shrink-0 font-medium">mg/dL</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Ref: 0.6 – 1.3 mg/dL</div>
                  </div>

                  {/* eGFR */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-800">eGFR (CKD-EPI)</label>
                      <span className={`text-[10px] px-2 py-0.2 rounded font-semibold ${evaluateParam(bloodWorkup.rft.egfr, 60.0, 150.0).color}`}>
                        {evaluateParam(bloodWorkup.rft.egfr, 60.0, 150.0).label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="1.0"
                        placeholder="91.0"
                        value={bloodWorkup.rft.egfr}
                        onChange={(e) => handleLabChange('rft', 'egfr', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold"
                      />
                      <span className="text-[10px] text-slate-500 shrink-0 font-medium">mL/min</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Ref: &ge; 60.0 mL/min/1.73m²</div>
                  </div>

                  {/* Uric Acid */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-800">Serum Uric Acid</label>
                      <span className={`text-[10px] px-2 py-0.2 rounded font-semibold ${evaluateParam(bloodWorkup.rft.uric_acid, 3.5, 7.2).color}`}>
                        {evaluateParam(bloodWorkup.rft.uric_acid, 3.5, 7.2).label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="5.4"
                        value={bloodWorkup.rft.uric_acid}
                        onChange={(e) => handleLabChange('rft', 'uric_acid', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold"
                      />
                      <span className="text-[11px] text-slate-500 shrink-0 font-medium">mg/dL</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Ref: 3.5 – 7.2 mg/dL</div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Electrolytes */}
            {activeLabTab === 'electrolytes' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {/* Sodium */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-800">Sodium (Na⁺)</label>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${evaluateParam(bloodWorkup.electrolytes.sodium, 135.0, 145.0).color}`}>
                        {evaluateParam(bloodWorkup.electrolytes.sodium, 135.0, 145.0).label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.5"
                        placeholder="140.0"
                        value={bloodWorkup.electrolytes.sodium}
                        onChange={(e) => handleLabChange('electrolytes', 'sodium', e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold"
                      />
                      <span className="text-[10px] text-slate-500 shrink-0">mEq/L</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Ref: 135 – 145</div>
                  </div>

                  {/* Potassium */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-800">Potassium (K⁺)</label>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${evaluateParam(bloodWorkup.electrolytes.potassium, 3.5, 5.0).color}`}>
                        {evaluateParam(bloodWorkup.electrolytes.potassium, 3.5, 5.0).label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="4.2"
                        value={bloodWorkup.electrolytes.potassium}
                        onChange={(e) => handleLabChange('electrolytes', 'potassium', e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold"
                      />
                      <span className="text-[10px] text-slate-500 shrink-0">mEq/L</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Ref: 3.5 – 5.0</div>
                  </div>

                  {/* Chloride */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-800">Chloride (Cl⁻)</label>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${evaluateParam(bloodWorkup.electrolytes.chloride, 96.0, 106.0).color}`}>
                        {evaluateParam(bloodWorkup.electrolytes.chloride, 96.0, 106.0).label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.5"
                        placeholder="101.0"
                        value={bloodWorkup.electrolytes.chloride}
                        onChange={(e) => handleLabChange('electrolytes', 'chloride', e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold"
                      />
                      <span className="text-[10px] text-slate-500 shrink-0">mEq/L</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Ref: 96 – 106</div>
                  </div>

                  {/* Bicarbonate */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-800">Bicarbonate (HCO₃⁻)</label>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${evaluateParam(bloodWorkup.electrolytes.bicarbonate, 22.0, 29.0).color}`}>
                        {evaluateParam(bloodWorkup.electrolytes.bicarbonate, 22.0, 29.0).label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.5"
                        placeholder="25.0"
                        value={bloodWorkup.electrolytes.bicarbonate}
                        onChange={(e) => handleLabChange('electrolytes', 'bicarbonate', e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold"
                      />
                      <span className="text-[10px] text-slate-500 shrink-0">mEq/L</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Ref: 22 – 29</div>
                  </div>

                  {/* Calcium */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-800">Calcium (Ca²⁺)</label>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${evaluateParam(bloodWorkup.electrolytes.calcium, 8.5, 10.5).color}`}>
                        {evaluateParam(bloodWorkup.electrolytes.calcium, 8.5, 10.5).label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="9.4"
                        value={bloodWorkup.electrolytes.calcium}
                        onChange={(e) => handleLabChange('electrolytes', 'calcium', e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold"
                      />
                      <span className="text-[10px] text-slate-500 shrink-0">mg/dL</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Ref: 8.5 – 10.5</div>
                  </div>
                </div>
              </div>
            )}

            {/* Optional Laboratory Document Upload */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-600" />
                  <span className="text-xs font-bold text-slate-800">Attach Laboratory Report Document / PDF (Optional)</span>
                </div>
                {labReportFile && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">
                    Attached: {labReportFile.name}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={labFileInputRef}
                  accept=".pdf,.png,.jpg,.jpeg,.tiff"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setLabReportFile(e.target.files[0]);
                    }
                  }}
                  className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                {labReportFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setLabReportFile(null);
                      if (labFileInputRef.current) labFileInputRef.current.value = '';
                    }}
                    className="text-rose-600 hover:text-rose-800 text-xs font-semibold"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Pathologist / Laboratory Clinical Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Clinical notes, hematologist remarks, or pre-chemotherapy clearance comments..."
                  value={bloodWorkup.report_notes}
                  onChange={(e) => setBloodWorkup(prev => ({ ...prev, report_notes: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setActiveStep(4)}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(6)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <span>Continue to Medical Imaging</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SECTION F: MEDICAL IMAGING UPLOAD & CLINICAL NOTES */}
        {activeStep === 6 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">6</span>
                <h2 className="text-sm font-bold text-gray-800">Section 6: Medical Imaging Upload & Clinical Notes</h2>
              </div>
              <span className="text-[11px] text-gray-400">Step 6 of 6</span>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-blue-500 bg-blue-50/70 scale-[0.99]'
                  : uploadedFile
                  ? 'border-emerald-400 bg-emerald-50/30'
                  : 'border-gray-300 hover:border-gray-400 bg-gray-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.dcm,.nii,.nii.gz,.tiff,.bmp,.pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    processSelectedFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              {!uploadedFile ? (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-800">
                      Drag & Drop Medical CT Scan or Radiological Report
                    </span>
                    <span className="text-xs text-gray-500 block mt-0.5">
                      or click to browse from local computer
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[10px] text-gray-500">
                    <span className="px-2 py-0.5 bg-gray-200 rounded font-mono font-medium">PNG</span>
                    <span className="px-2 py-0.5 bg-gray-200 rounded font-mono font-medium">JPG / JPEG</span>
                    <span className="px-2 py-0.5 bg-gray-200 rounded font-mono font-medium">DICOM (.dcm)</span>
                    <span className="px-2 py-0.5 bg-gray-200 rounded font-mono font-medium">NIfTI (.nii)</span>
                    <span className="px-2 py-0.5 bg-gray-200 rounded font-mono font-medium">TIFF</span>
                    <span className="px-2 py-0.5 bg-gray-200 rounded font-mono font-medium">PDF Report</span>
                    <span className="text-gray-400">(Max 30MB)</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between text-left">
                  <div className="flex items-center gap-3">
                    {imagePreviewUrl ? (
                      <img
                        src={imagePreviewUrl}
                        alt="Preview"
                        className="w-14 h-14 object-cover rounded-xl border border-emerald-300"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <span>{imageMetadata?.name}</span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                          READY TO PERSIST
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {imageMetadata?.format} · {imageMetadata?.dimensions} · {imageMetadata?.size}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage();
                    }}
                    className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Clinical Intake Notes */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Doctor Assessment Notes</label>
              <textarea
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
              />
            </div>

            <div className="pt-4 flex justify-between border-t border-gray-100">
              <button
                type="button"
                onClick={() => setActiveStep(5)}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold"
              >
                Back
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Draft</span>
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>{loading ? 'Persisting to SQLite...' : 'Submit Complete Assessment'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
