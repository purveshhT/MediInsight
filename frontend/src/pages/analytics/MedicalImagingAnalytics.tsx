import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  ScatterChart, Scatter, Cell, CartesianGrid, PieChart, Pie
} from 'recharts';
import { Scan, Brain, Layers, AlertCircle, Database, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { getImagingOverview, getImagingSamples, getImagingSample, getImagingPCA, getModelEvaluationAnalytics } from '../../services/api';
import { CHART_COLORS } from '../../utils/colors';

export function MedicalImagingAnalytics() {
  const { data: overview, loading: loadOverview } = useApi(getImagingOverview);
  const { data: pcaData } = useApi(getImagingPCA);
  const { data: modelEval } = useApi(getModelEvaluationAnalytics);

  const [samples, setSamples] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number>(0);
  const [activeSample, setActiveSample] = useState<any>(null);
  const [activeSlice, setActiveSlice] = useState<'slice_25pct' | 'slice_50pct' | 'slice_75pct'>('slice_50pct');
  const [loadingSample, setLoadingSample] = useState(false);

  useEffect(() => {
    getImagingSamples('test', 24)
      .then(res => {
        setSamples(res.data.samples || []);
        if (res.data.samples?.length > 0) {
          setSelectedId(res.data.samples[0].sample_id);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLoadingSample(true);
    getImagingSample(selectedId, 'test')
      .then(res => setActiveSample(res.data))
      .catch(console.error)
      .finally(() => setLoadingSample(false));
  }, [selectedId]);

  if (loadOverview) {
    return <div className="p-12 text-center text-sm text-slate-400">Loading NoduleMNIST3D imaging analytics...</div>;
  }

  const { class_distribution, image_stats, intensity_histogram, splits } = (overview || {}) as any;

  // Format intensity histogram data for chart
  const histChartData = intensity_histogram?.bins?.map((bin: number, idx: number) => ({
    bin: bin.toFixed(0),
    count: intensity_histogram.counts[idx],
  })) || [];

  const classPieData = class_distribution ? [
    { name: 'Benign (0)', count: class_distribution.Benign },
    { name: 'Malignant (1)', count: class_distribution.Malignant },
  ] : [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Medical Imaging Analytics & 3D CT Exploration</h1>
        <p className="text-slate-500 text-sm mt-1">
          NoduleMNIST3D volumetric dataset (1,633 samples of 28×28×28 CT volumes), feature extraction, PCA projection, and 3D slice navigation.
        </p>
      </div>

      {/* Dataset Governance Boundary Callout */}
      <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
        <div className="text-xs text-sky-900 leading-relaxed">
          <strong>Dataset Isolation Guarantee:</strong> NoduleMNIST3D is an independent benchmark dataset derived from the LIDC-IDRI study.
          These preprocessed volumes are <strong>NOT</strong> linked to the NSCLC-Radiomics or NSCLC Radiogenomics patient cohorts.
          All imaging models operate exclusively on this imaging domain.
        </div>
      </div>

      {/* Interactive 3D CT Volume Viewer & Explorer */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between border-b pb-4 mb-6 gap-3">
          <div className="flex items-center gap-2">
            <Scan className="w-5 h-5 text-cyan-600" />
            <h2 className="text-sm font-bold text-slate-800">Interactive 3D CT Volume Explorer</h2>
            <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">28 × 28 × 28 Voxels</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Test Set Sample:</span>
            <select
              value={selectedId}
              onChange={e => setSelectedId(Number(e.target.value))}
              className="px-2.5 py-1 border border-slate-300 rounded-lg text-xs bg-white font-mono"
            >
              {samples.map(s => (
                <option key={s.sample_id} value={s.sample_id}>
                  Sample #{s.sample_id} ({s.label_name})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* 3D Volume Slices Preview */}
          <div className="flex flex-col items-center">
            <div className="bg-black p-3 rounded-2xl border-2 border-slate-800 shadow-md">
              {loadingSample ? (
                <div className="w-56 h-56 flex items-center justify-center text-xs text-slate-400">Loading volume...</div>
              ) : activeSample?.slices ? (
                <div
                  className="grid grid-cols-28 gap-0 border border-neutral-700"
                  style={{ gridTemplateColumns: 'repeat(28, minmax(0, 1fr))', width: 224, height: 224 }}
                >
                  {activeSample.slices[activeSlice]?.flat().map((val: number, idx: number) => (
                    <div
                      key={idx}
                      style={{ backgroundColor: `rgb(${val}, ${val}, ${val})` }}
                      className="w-2 h-2"
                    />
                  ))}
                </div>
              ) : null}
            </div>

            {/* Slice Selectors */}
            <div className="flex gap-2 mt-3 text-xs bg-slate-100 p-1.5 rounded-xl">
              {(['slice_25pct', 'slice_50pct', 'slice_75pct'] as const).map(sl => (
                <button
                  key={sl}
                  onClick={() => setActiveSlice(sl)}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    activeSlice === sl ? 'bg-white text-cyan-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {sl === 'slice_25pct' ? 'Axial 25%' : sl === 'slice_50pct' ? 'Center 50%' : 'Axial 75%'}
                </button>
              ))}
            </div>
          </div>

          {/* Volume Metadata & Summary */}
          <div className="space-y-4 md:col-span-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block">Class Label</span>
                <span className={`text-sm font-bold ${activeSample?.label === 1 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {activeSample?.label_name || 'Loading...'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block">Intensity Mean</span>
                <span className="text-sm font-bold text-slate-800 font-mono">{activeSample?.stats?.mean}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block">Intensity Std Dev</span>
                <span className="text-sm font-bold text-slate-800 font-mono">{activeSample?.stats?.std}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block">Peak Voxel Value</span>
                <span className="text-sm font-bold text-slate-800 font-mono">{activeSample?.stats?.max} / 255</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block">Non-Zero Voxels</span>
                <span className="text-sm font-bold text-slate-800 font-mono">{activeSample?.stats?.nonzero_voxels}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block">Spatial Resolution</span>
                <span className="text-sm font-bold text-slate-800 font-mono">1.0 mm (iso)</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              3D lung CT nodules are extracted from the MedMNIST collection. Volumes are standardized to uint8 grayscale arrays.
              Statistical feature extraction summarizes voxel gradient, core density, and axial distribution for machine learning.
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Class Imbalance Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-800 mb-1">Class Distribution (1,633 Total Samples)</h2>
          <p className="text-xs text-slate-400 mb-4">Benign (0) vs Malignant (1) — Inherent ~3:1 Imbalance</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={classPieData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  label={({ payload }: any) => `${payload.name}: ${payload.count}`}
                >
                  <Cell fill="#06b6d4" />
                  <Cell fill="#f97316" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Global Voxel Intensity Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-800 mb-1">Global Voxel Intensity Distribution</h2>
          <p className="text-xs text-slate-400 mb-4">Histogram across all 21,952 voxels per 3D volume</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="bin" stroke="#94a3b8" fontSize={10} interval={4} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Voxels" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PCA 2D Projection */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs md:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-bold text-slate-800">PCA Projection of 3D CT Hand-Crafted Features</h2>
            <span className="text-xs text-slate-400">Total Variance Explained: {((pcaData?.total_variance_explained || 0) * 100).toFixed(1)}%</span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            2D projection of 20 statistical features extracted from NoduleMNIST3D test volumes (n=310)
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" dataKey="pc1" name="PC1" stroke="#94a3b8" fontSize={11} />
                <YAxis type="number" dataKey="pc2" name="PC2" stroke="#94a3b8" fontSize={11} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Nodules" data={pcaData?.points || []}>
                  {(pcaData?.points || []).map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.label === 1 ? '#f97316' : '#06b6d4'}
                      opacity={0.8}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 text-xs mt-2">
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-cyan-500 inline-block" /> Benign Nodules (Class 0)</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block" /> Malignant Nodules (Class 1)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
