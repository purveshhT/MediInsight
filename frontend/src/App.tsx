import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UnifiedLayout } from './layouts/UnifiedLayout';

// Doctor pages
import { DoctorDashboard } from './pages/doctor/DoctorDashboard';
import { NewAssessment } from './pages/doctor/NewAssessment';
import { ClinicalAnalysis } from './pages/doctor/ClinicalAnalysis';
import { TreatmentRecommendations } from './pages/doctor/TreatmentRecommendations';
import { SimilarCases } from './pages/doctor/SimilarCases';
import { PatientHistory } from './pages/doctor/PatientHistory';
import { Reports } from './pages/doctor/Reports';

// Analytics pages
import { HealthcareOverview } from './pages/analytics/HealthcareOverview';
import { NewAssessmentAnalytics } from './pages/analytics/NewAssessmentAnalytics';
import { PatientAnalytics } from './pages/analytics/PatientAnalytics';
import { ClinicalAnalyticsPage } from './pages/analytics/ClinicalAnalyticsPage';
import { MedicalImagingAnalytics } from './pages/analytics/MedicalImagingAnalytics';
import { TreatmentAnalyticsPage } from './pages/analytics/TreatmentAnalyticsPage';
import { AIRecommendationAnalytics } from './pages/analytics/AIRecommendationAnalytics';
import { SimilarityAnalytics } from './pages/analytics/SimilarityAnalytics';
import { ModelEvaluation } from './pages/analytics/ModelEvaluation';
import { DataQuality } from './pages/analytics/DataQuality';
import { DatasetExplorer } from './pages/analytics/DatasetExplorer';

// System pages
import { DatasetManagement } from './pages/system/DatasetManagement';
import { ModelRegistry } from './pages/system/ModelRegistry';
import { SettingsPage } from './pages/system/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Unified Application Shell */}
        <Route path="/" element={<UnifiedLayout />}>
          {/* Default Root Redirect to Doctor Workspace */}
          <Route index element={<Navigate to="/doctor" replace />} />

          {/* ─── Doctor Workspace ───────────────────────────────── */}
          <Route path="doctor">
            <Route index element={<DoctorDashboard />} />
            <Route path="assessment" element={<NewAssessment />} />
            <Route path="clinical-analysis" element={<ClinicalAnalysis />} />
            <Route path="clinical" element={<Navigate to="/doctor/clinical-analysis" replace />} />
            <Route path="recommendations" element={<TreatmentRecommendations />} />
            <Route path="similar-cases" element={<SimilarCases />} />
            <Route path="history" element={<PatientHistory />} />
            <Route path="reports" element={<Reports />} />
          </Route>

          {/* ─── Analytics & Research Workspace ─────────────────── */}
          <Route path="analytics">
            <Route index element={<HealthcareOverview />} />
            <Route path="overview" element={<HealthcareOverview />} />
            <Route path="new-assessments" element={<NewAssessmentAnalytics />} />
            <Route path="patients" element={<PatientAnalytics />} />
            <Route path="patient" element={<Navigate to="/analytics/patients" replace />} />
            <Route path="clinical" element={<ClinicalAnalyticsPage />} />
            <Route path="imaging" element={<MedicalImagingAnalytics />} />
            <Route path="treatment" element={<TreatmentAnalyticsPage />} />
            <Route path="recommendations" element={<AIRecommendationAnalytics />} />
            <Route path="ai-recommendations" element={<Navigate to="/analytics/recommendations" replace />} />
            <Route path="similarity" element={<SimilarityAnalytics />} />
            <Route path="evaluation" element={<ModelEvaluation />} />
            <Route path="model-evaluation" element={<Navigate to="/analytics/evaluation" replace />} />
            <Route path="data-quality" element={<DataQuality />} />
            <Route path="datasets" element={<DatasetExplorer />} />
            <Route path="dataset-explorer" element={<Navigate to="/analytics/datasets" replace />} />
          </Route>

          {/* ─── System & Data Management ───────────────────────── */}
          <Route path="system">
            <Route index element={<Navigate to="/system/datasets" replace />} />
            <Route path="datasets" element={<DatasetManagement />} />
            <Route path="models" element={<ModelRegistry />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/doctor" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
