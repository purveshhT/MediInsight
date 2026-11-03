import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Stethoscope, BarChart3, UserPlus, RefreshCw, AlertCircle, ChevronRight, Check
} from 'lucide-react';

export function UnifiedHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [justRefreshed, setJustRefreshed] = useState(false);

  const isAnalytics = location.pathname.startsWith('/analytics');
  const isDoctor = location.pathname.startsWith('/doctor');

  // Compute breadcrumb label
  const pathParts = location.pathname.split('/').filter(Boolean);
  const workspaceTitle = isAnalytics ? 'Analytics & Research' : 'Doctor Workspace';
  const pageTitle = pathParts[1]
    ? pathParts[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : isAnalytics ? 'Overview' : 'Dashboard';

  const handleRefresh = () => {
    setRefreshing(true);
    setJustRefreshed(false);
    setTimeout(() => {
      setRefreshing(false);
      setJustRefreshed(true);
      window.dispatchEvent(new Event('mediinsight-refresh'));
      setTimeout(() => setJustRefreshed(false), 2000);
    }, 600);
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-30 select-none shadow-xs">
      {/* Left: Workspace indicator & breadcrumbs */}
      <div className="flex items-center gap-2.5 text-xs">
        <span
          className={`px-2.5 py-1 rounded-md font-bold uppercase tracking-wider flex items-center gap-1.5 ${
            isAnalytics
              ? 'bg-cyan-50 text-cyan-800 border border-cyan-200'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}
        >
          {isAnalytics ? <BarChart3 className="w-3.5 h-3.5 text-cyan-600" /> : <Stethoscope className="w-3.5 h-3.5 text-blue-600" />}
          {workspaceTitle}
        </span>

        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="font-semibold text-gray-800">{pageTitle}</span>
      </div>

      {/* Right: Quick Actions */}
      <div className="flex items-center gap-3">
        {/* Research Disclaimer pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-[11px]">
          <AlertCircle className="w-3 h-3 text-amber-600" />
          <span>Research Prototype · Isolated Cohorts</span>
        </div>

        {/* Global Refresh Data Action */}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-xs font-medium transition-colors"
          title="Synchronize and refresh all dashboard endpoints"
        >
          {justRefreshed ? (
            <Check className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
          )}
          <span>{refreshing ? 'Syncing...' : justRefreshed ? 'Synced' : 'Refresh Data'}</span>
        </button>

        {/* Quick New Patient Intake Button */}
        <button
          onClick={() => navigate('/doctor/assessment')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>New Assessment</span>
        </button>
      </div>
    </header>
  );
}
