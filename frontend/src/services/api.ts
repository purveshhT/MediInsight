import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// ─── Health ──────────────────────────────────────────────────────────────────
export const healthCheck = () => api.get('/health');

// ─── Datasets ────────────────────────────────────────────────────────────────
export const listDatasets = () => api.get('/datasets');
export const getDatasetStats = () => api.get('/datasets/stats');
export const getDatasetQuality = () => api.get('/datasets/quality');
export const getDatasetSummary = (id: string) => api.get(`/datasets/${id}/summary`);
export const getDatasetQualityById = (id: string) => api.get(`/datasets/${id}/quality`);
export const exploreDataset = (id: string, page = 1, pageSize = 50) =>
  api.get(`/datasets/${id}/explore`, { params: { page, page_size: pageSize } });

// ─── Analytics ───────────────────────────────────────────────────────────────
export const getAnalyticsOverview = (source = 'all') =>
  api.get('/analytics/overview', { params: { source } });
export const getClinicalAnalytics = () => api.get('/analytics/clinical');
export const getTreatmentAnalytics = () => api.get('/analytics/treatment');
export const getImagingAnalytics = () => api.get('/analytics/imaging');
export const getSurvivalAnalytics = () => api.get('/analytics/survival');
export const getSurvivalByGender = () => api.get('/analytics/survival/gender');
export const getImagingPCA = () => api.get('/analytics/imaging/pca');
export const getModelEvaluationAnalytics = () => api.get('/analytics/models/evaluation');

// ─── New Assessment Analytics (Dynamic Sync) ──────────────────────────────────
export const getNewAssessmentsOverview = () => api.get('/analytics/assessments/overview');
export const getNewAssessmentsDemographics = () => api.get('/analytics/assessments/demographics');
export const getNewAssessmentsStaging = () => api.get('/analytics/assessments/staging');
export const getNewAssessmentsHistology = () => api.get('/analytics/assessments/histology');
export const getNewAssessmentsBiomarkers = () => api.get('/analytics/assessments/biomarkers');
export const getNewAssessmentsActivity = () => api.get('/analytics/assessments/activity');

// ─── Imaging ──────────────────────────────────────────────────────────────────
export const getImagingOverview = () => api.get('/imaging/overview');
export const getImagingSamples = (split = 'test', limit = 50) =>
  api.get('/imaging/samples', { params: { split, limit } });
export const getImagingSample = (id: number, split = 'test') =>
  api.get(`/imaging/samples/${id}`, { params: { split } });
export const predictNodule = (sampleId: number, split = 'test') =>
  api.post('/imaging/predict', null, { params: { sample_id: sampleId, split } });
export const getSimilarImagingCases = (sampleId: number, split = 'test', n = 5) =>
  api.get('/imaging/similar', { params: { sample_id: sampleId, split, n_neighbors: n } });

// ─── Assessment & SQLite Persistence ──────────────────────────────────────────
export const createAssessment = (data: Record<string, unknown>) =>
  api.post('/assessment', data);
export const listAssessments = () => api.get('/assessment');
export const getAssessment = (id: string) => api.get(`/assessment/${id}`);
export const updateAssessment = (id: string, data: Record<string, unknown>) =>
  api.put(`/assessment/${id}`, data);
export const deleteAssessment = (id: string) => api.delete(`/assessment/${id}`);

// ─── Medical Image Upload ─────────────────────────────────────────────────────
export const uploadAssessmentImage = (assessmentId: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/assessment/${assessmentId}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const listAssessmentImages = (assessmentId: string) =>
  api.get(`/assessment/${assessmentId}/images`);

export const getImageInfo = (imageId: string) => api.get(`/images/${imageId}`);
export const getImageFileUrl = (imageId: string) => `${API_BASE}/images/${imageId}/file`;
export const deleteImage = (imageId: string) => api.delete(`/images/${imageId}`);
export const analyzeAssessmentImage = (assessmentId: string, imageId: string) =>
  api.post(`/assessment/${assessmentId}/images/${imageId}/analyze`);

// ─── Recommendations ─────────────────────────────────────────────────────────
export const getRecommendations = (data: Record<string, unknown>) =>
  api.post('/recommendations', data);

// ─── Models ──────────────────────────────────────────────────────────────────
export const listModels = () => api.get('/models');
export const trainModel = (modelId = 'nodule_classifier') =>
  api.post('/models/train', null, { params: { model_id: modelId } });
export const getModelEvaluation = () => api.get('/models/evaluation');
export const getSimilarCases = (params: Record<string, unknown>) =>
  api.get('/similar-cases', { params });

export default api;
