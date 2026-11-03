import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Users, Search, AlertCircle, ArrowRight, ExternalLink, Calendar, HeartPulse } from 'lucide-react';
import { getSimilarCases } from '../../services/api';

export function SimilarCases() {
  const location = useLocation();
  const navigate = useNavigate();

  const [query, setQuery] = useState({
    age: location.state?.patient?.age ?? 65,
    gender: location.state?.patient?.gender ?? 'male',
    histology: location.state?.patient?.histology ?? 'adenocarcinoma',
    t_stage: location.state?.patient?.t_stage ?? '2',
    n_stage: location.state?.patient?.n_stage ?? '2',
    m_stage: location.state?.patient?.m_stage ?? '0',
    n_neighbors: 6,
  });

  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchCases = () => {
    setLoading(true);
    getSimilarCases(query)
      .then(res => setResults(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCases();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Similar Patient Cases</h1>
          <p className="text-gray-500 mt-1">Nearest-neighbor case retrieval across NSCLC-Radiomics cohort (n=422)</p>
        </div>
        <button
          onClick={() => navigate('/doctor/reports', { state: { query, results } })}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 flex items-center gap-2"
        >
          Generate Clinical Report <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Query Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
        <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Search className="w-4 h-4 text-blue-600" /> Patient Match Criteria
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">Age</label>
            <input
              type="number"
              value={query.age}
              onChange={e => setQuery({ ...query, age: Number(e.target.value) })}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">Gender</label>
            <select
              value={query.gender}
              onChange={e => setQuery({ ...query, gender: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">Histology</label>
            <select
              value={query.histology}
              onChange={e => setQuery({ ...query, histology: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs"
            >
              <option value="adenocarcinoma">Adenocarcinoma</option>
              <option value="squamous cell carcinoma">Squamous</option>
              <option value="large cell">Large Cell</option>
              <option value="nos">NOS</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">T-Stage</label>
            <select
              value={query.t_stage}
              onChange={e => setQuery({ ...query, t_stage: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs"
            >
              <option value="1">T1</option>
              <option value="2">T2</option>
              <option value="3">T3</option>
              <option value="4">T4</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">N-Stage</label>
            <select
              value={query.n_stage}
              onChange={e => setQuery({ ...query, n_stage: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs"
            >
              <option value="0">N0</option>
              <option value="1">N1</option>
              <option value="2">N2</option>
              <option value="3">N3</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchCases}
              disabled={loading}
              className="w-full py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search Cases'}
            </button>
          </div>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          Similarity is calculated as the inverse standardized Euclidean distance across clinical stage and demographic features.
          <strong> Similarity does NOT imply equivalent biological progression or treatment response.</strong> All records are historical research cases from TCIA NSCLC-Radiomics.
        </p>
      </div>

      {/* Results Cards / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 py-16 text-center text-sm text-gray-400">Querying clinical feature index...</div>
        ) : results?.similar_cases?.map((c: any) => (
          <div key={c.rank} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs hover:border-blue-300 transition-all">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <span className="font-mono text-xs font-bold text-gray-800 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" /> {c.patient_id}
              </span>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-md">
                Match: {(c.similarity_score * 100).toFixed(1)}%
              </span>
            </div>

            <div className="py-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Demographics:</span>
                <span className="font-semibold text-gray-800">{c.age ? `${c.age.toFixed(1)} yrs` : 'N/A'}, {c.gender}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Histology:</span>
                <span className="font-medium text-gray-800 capitalize">{c.histology}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Stage:</span>
                <span className="font-bold text-blue-700">{c.overall_stage || `T${c.t_stage}N${c.n_stage}M${c.m_stage}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">T / N / M:</span>
                <span className="text-gray-700">T{c.t_stage} / N{c.n_stage} / M{c.m_stage}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 bg-gray-50/50 -mx-5 -mb-5 p-4 rounded-b-2xl">
              <div className="text-[11px] text-gray-600 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-gray-500"><Calendar className="w-3 h-3" /> Survival Time:</span>
                  <strong className="text-gray-900">{c.survival_time ? `${c.survival_time.toFixed(0)} days` : 'N/A'}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-gray-500"><HeartPulse className="w-3 h-3" /> Event Status:</span>
                  <span className={`font-semibold ${c.dead_status === 1 ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {c.dead_status === 1 ? 'Deceased' : 'Censored / Alive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

