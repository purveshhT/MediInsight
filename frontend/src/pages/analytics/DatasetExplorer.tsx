import React, { useState, useEffect } from 'react';
import { Database, Search, ChevronLeft, ChevronRight, Download, Filter, Layers } from 'lucide-react';
import { exploreDataset, listDatasets } from '../../services/api';

export function DatasetExplorer() {
  const [datasetId, setDatasetId] = useState('nsclc_radiomics');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchCol, setSearchCol] = useState('');
  const [searchVal, setSearchVal] = useState('');

  const fetchRecords = () => {
    setLoading(true);
    exploreDataset(datasetId, page, pageSize)
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPage(1);
  }, [datasetId]);

  useEffect(() => {
    fetchRecords();
  }, [datasetId, page, pageSize]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dataset Explorer & Raw Record Inspector</h1>
          <p className="text-slate-500 text-sm mt-1">
            Browse, filter, and inspect cleaned records across all public research cohorts.
          </p>
        </div>

        {/* Dataset Switcher Tabs */}
        <div className="flex flex-wrap bg-slate-200 p-1 rounded-xl text-xs font-semibold gap-1">
          {[
            { id: 'nsclc_radiomics', label: 'NSCLC-Radiomics (422)' },
            { id: 'nsclc_radiogenomics', label: 'NSCLC Radiogenomics (211)' },
            { id: 'tcia_diagnosis', label: 'TCIA Diagnosis (157)' },
            { id: 'iq_othnccd', label: 'IQ-OTH/NCCD CT (1,294)' },
            { id: 'chest_ct_subtypes', label: 'Chest CT Subtypes (1,000)' },
          ].map(ds => (
            <button
              key={ds.id}
              onClick={() => setDatasetId(ds.id)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                datasetId === ds.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              {ds.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dataset Summary Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <Database className="w-4 h-4 text-cyan-600" />
          <span className="font-semibold text-slate-800">
            Cohort: <span className="font-bold text-blue-700">{datasetId}</span>
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-600 font-mono">
            {data?.total_records ?? '...'} Total Records ({data?.columns?.length ?? 0} Attributes)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-500">Rows per page:</span>
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="px-2 py-1 border border-slate-300 rounded text-xs bg-white"
          >
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Interactive Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-16 text-center text-sm text-slate-400">Loading dataset partition...</div>
        ) : !data?.records || data.records.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">No records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center font-mono">#</th>
                  {data.columns.slice(0, 10).map((col: string) => (
                    <th key={col} className="py-2.5 px-3 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                  {data.columns.length > 10 && (
                    <th className="py-2.5 px-3 whitespace-nowrap text-slate-400">
                      +{data.columns.length - 10} more cols
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.records.map((row: any, rIdx: number) => (
                  <tr key={rIdx} className="hover:bg-slate-50/70">
                    <td className="py-2 px-3 text-center font-mono text-slate-400">
                      {(page - 1) * pageSize + rIdx + 1}
                    </td>
                    {data.columns.slice(0, 10).map((col: string) => {
                      const val = row[col];
                      return (
                        <td key={col} className="py-2 px-3 whitespace-nowrap text-slate-700 font-mono">
                          {val === null || val === undefined || val === '' ? (
                            <span className="text-slate-300">null</span>
                          ) : (
                            String(val)
                          )}
                        </td>
                      );
                    })}
                    {data.columns.length > 10 && (
                      <td className="py-2 px-3 text-slate-400 text-[10px]">...</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>
            Page <strong className="font-bold text-slate-900">{page}</strong> of{' '}
            <strong className="font-bold text-slate-900">{data?.total_pages || 1}</strong>
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 border border-slate-300 bg-white rounded-lg flex items-center gap-1 hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(data?.total_pages || 1, p + 1))}
              disabled={page >= (data?.total_pages || 1)}
              className="px-3 py-1.5 border border-slate-300 bg-white rounded-lg flex items-center gap-1 hover:bg-slate-100 disabled:opacity-40"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

