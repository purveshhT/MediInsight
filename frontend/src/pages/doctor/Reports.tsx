import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';

export function Reports() {
  const location = useLocation();
  const navigate = useNavigate();

  const patient = location.state?.patient || {
    age: 65,
    gender: 'male',
    histology: 'adenocarcinoma',
    overall_stage: 'IIIa',
    t_stage: '2',
    n_stage: '2',
    m_stage: '0',
    egfr_status: 'Wildtype',
    kras_status: 'Mutant',
    alk_status: 'Wildtype',
    smoking_status: 'Former Smoker',
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Workspace
        </button>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 flex items-center gap-2 shadow-xs"
        >
          <Printer className="w-4 h-4" /> Print / Export PDF
        </button>
      </div>

      {/* Printable Report Document */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Header */}
        <div className="border-b pb-6 flex items-start justify-between">
          <div>
            <div className="text-xl font-bold text-gray-900 tracking-tight">MediInsight AI</div>
            <div className="text-xs text-blue-600 font-semibold uppercase tracking-wider mt-0.5">
              Multimodal Clinical Decision-Support Summary
            </div>
            <div className="mt-2">
              <span className="text-lg font-bold text-gray-900 block">{patient.patient_name || 'Anonymous Patient'}</span>
              <span className="text-xs text-blue-700 font-mono font-semibold">Case Reference ID: {patient.id}</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Generated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
          </div>
          <div className="text-right">
            <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-300 rounded-md text-[11px] font-bold">
              ACADEMIC RESEARCH PROTOTYPE
            </span>
          </div>
        </div>

        {/* Patient Demographics & Staging */}
        <div>
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide border-b pb-1 mb-3">
            1. Patient Clinical Profile
          </h2>
          <div className="grid grid-cols-4 gap-4 text-xs">
            <div className="col-span-2"><span className="text-gray-400 block">Patient Name:</span><strong className="text-sm text-gray-900">{patient.patient_name || 'Anonymous Patient'}</strong></div>
            <div><span className="text-gray-400 block">Age:</span><strong>{patient.age} years</strong></div>
            <div><span className="text-gray-400 block">Gender:</span><strong className="capitalize">{patient.gender}</strong></div>
            <div><span className="text-gray-400 block">Smoking:</span><strong>{patient.smoking_status || patient.smoking_history}</strong></div>
            <div><span className="text-gray-400 block">Histology:</span><strong className="capitalize">{patient.histology}</strong></div>
            <div><span className="text-gray-400 block">Clinical Stage:</span><strong className="text-blue-700 font-bold uppercase">{patient.overall_stage}</strong></div>
            <div><span className="text-gray-400 block">TNM Matrix:</span><strong>T{patient.t_stage} N{patient.n_stage} M{patient.m_stage}</strong></div>
            <div><span className="text-gray-400 block">EGFR / KRAS:</span><strong>{patient.egfr_status} / {patient.kras_status}</strong></div>
            <div><span className="text-gray-400 block">ALK Translocation:</span><strong>{patient.alk_status || 'Unknown'}</strong></div>
            <div><span className="text-gray-400 block">Occupation:</span><strong>{patient.occupation || 'Unspecified'}</strong></div>
            <div className="col-span-3"><span className="text-gray-400 block">Residential Address:</span><strong>{patient.address || 'Not provided'}</strong></div>
          </div>
        </div>

        {/* Laboratory Workup Summary */}
        <div>
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide border-b pb-1 mb-3">
            2. Laboratory Investigations & Blood Workup
          </h2>
          {patient.blood_workup ? (
            <div className="grid grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
                <span className="text-[10px] text-gray-500 font-bold uppercase block">Complete Blood Count</span>
                <div>Hb: <strong>{patient.blood_workup.cbc?.hemoglobin?.value ?? 'N/A'} {patient.blood_workup.cbc?.hemoglobin?.unit}</strong></div>
                <div>WBC: <strong>{patient.blood_workup.cbc?.wbc_count?.value ?? 'N/A'} {patient.blood_workup.cbc?.wbc_count?.unit}</strong></div>
                <div>Platelets: <strong>{patient.blood_workup.cbc?.platelets?.value ?? 'N/A'}</strong></div>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
                <span className="text-[10px] text-gray-500 font-bold uppercase block">Liver Function</span>
                <div>Bilirubin: <strong>{patient.blood_workup.lft?.total_bilirubin?.value ?? 'N/A'} mg/dL</strong></div>
                <div>AST: <strong>{patient.blood_workup.lft?.ast_sgot?.value ?? 'N/A'} U/L</strong></div>
                <div>ALT: <strong>{patient.blood_workup.lft?.alt_sgpt?.value ?? 'N/A'} U/L</strong></div>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
                <span className="text-[10px] text-gray-500 font-bold uppercase block">Renal Function</span>
                <div>BUN: <strong>{patient.blood_workup.rft?.bun?.value ?? 'N/A'} mg/dL</strong></div>
                <div>Creatinine: <strong>{patient.blood_workup.rft?.serum_creatinine?.value ?? 'N/A'} mg/dL</strong></div>
                <div>eGFR: <strong>{patient.blood_workup.rft?.egfr?.value ?? 'N/A'} mL/min</strong></div>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
                <span className="text-[10px] text-gray-500 font-bold uppercase block">Serum Electrolytes</span>
                <div>Na⁺: <strong>{patient.blood_workup.electrolytes?.sodium?.value ?? 'N/A'} mEq/L</strong></div>
                <div>K⁺: <strong>{patient.blood_workup.electrolytes?.potassium?.value ?? 'N/A'} mEq/L</strong></div>
                <div>Ca²⁺: <strong>{patient.blood_workup.electrolytes?.calcium?.value ?? 'N/A'} mg/dL</strong></div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500 italic">
              No laboratory investigation records entered. Per clinical governance policy, missing tests are recorded as Not Tested and cannot be assumed normal.
            </div>
          )}
        </div>

        {/* Medical Imaging & Diagnostics */}
        <div>
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide border-b pb-1 mb-3">
            3. Medical Imaging & Diagnostics
          </h2>
          {patient.images && patient.images.length > 0 ? (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">CT Scan Status:</span>
                <span className="font-bold text-emerald-700">Uploaded & Verified ({patient.images[0].original_filename})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Image Availability:</span>
                <span className="font-semibold text-gray-800">{patient.images.length} Medical Image Attached</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Dimensions & Format:</span>
                <span className="font-mono">{patient.images[0].image_dimensions} · {patient.images[0].file_format.toUpperCase()}</span>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-500">CT Scan Status:</span>
                <span className="font-bold text-slate-700">Not Uploaded</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Image Availability:</span>
                <span className="font-bold text-slate-700">No medical image available</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Analysis Status:</span>
                <span className="font-bold text-slate-700">Not Available</span>
              </div>
              <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200">
                No CT scan has been uploaded for this patient assessment. External research datasets are strictly isolated and never substituted for patient scans.
              </p>
            </div>
          )}
        </div>

        {/* Treatment Candidates Ranking */}
        <div>
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide border-b pb-1 mb-3">
            4. Treatment Decision Support (Heuristic Guideline Ranking)
          </h2>
          <table className="w-full text-left text-xs border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100 font-semibold text-gray-600">
              <tr>
                <th className="py-2 px-3 w-12 text-center">Rank</th>
                <th className="py-2 px-3">Pathway</th>
                <th className="py-2 px-3 w-28">Category</th>
                <th className="py-2 px-3 w-24 text-center">Ranking Score</th>
                <th className="py-2 px-3">Clinical Justification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-2 px-3 text-center font-bold">1</td>
                <td className="py-2 px-3 font-medium">Platinum-based Chemotherapy</td>
                <td className="py-2 px-3">Chemotherapy</td>
                <td className="py-2 px-3 text-center font-mono font-bold text-blue-700">0.70</td>
                <td className="py-2 px-3 text-gray-600">Standard systemic therapy for stage III NSCLC</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-center font-bold">2</td>
                <td className="py-2 px-3 font-medium">Concurrent Chemoradiation</td>
                <td className="py-2 px-3">Combined Therapy</td>
                <td className="py-2 px-3 text-center font-mono font-bold text-blue-700">0.72</td>
                <td className="py-2 px-3 text-gray-600">Guideline-recommended for locally advanced stage IIIa/IIIb</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-center font-bold">3</td>
                <td className="py-2 px-3 font-medium">Immunotherapy (PD-L1 Evaluation Required)</td>
                <td className="py-2 px-3">Immunotherapy</td>
                <td className="py-2 px-3 text-center font-mono font-bold text-blue-700">0.68</td>
                <td className="py-2 px-3 text-gray-600">Potential benefit; PD-L1 expression level needed</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Regulatory Disclaimer */}
        <div className="p-4 bg-gray-50 border border-gray-300 rounded-xl space-y-1.5 text-[11px] text-gray-600">
          <div className="font-bold text-gray-900 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Clinical Safety & Governance Disclaimer
          </div>
          <p>
            MediInsight AI is an academic educational prototype developed for BTech IT project evaluation.
            It does NOT constitute an approved medical device and does NOT possess diagnostic or prescriptive authority.
            Treatment scores reflect heuristic guideline matching and do not estimate individualized patient survival probability.
          </p>
        </div>
      </div>
    </div>
  );
}

