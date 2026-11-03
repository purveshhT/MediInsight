import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity, Stethoscope, BarChart3, LayoutDashboard, UserPlus, Microscope,
  Pill, Users, Clock, FileText, Scan, Brain, GitCompare, Shield, Database,
  Settings, Layers, ChevronDown, ChevronRight, Sparkles, FolderKanban, CheckCircle
} from 'lucide-react';
import { listAssessments } from '../services/api';

export function UnifiedSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  // Detect current active workspace from URL path
  const isDoctor = location.pathname.startsWith('/doctor');
  const isAnalytics = location.pathname.startsWith('/analytics');
  const activeWorkspace = isAnalytics ? 'analytics' : 'doctor';

  const [assessmentCount, setAssessmentCount] = useState<number>(3);
  const [doctorExpanded, setDoctorExpanded] = useState<boolean>(true);
  const [analyticsExpanded, setAnalyticsExpanded] = useState<boolean>(true);
  const [systemExpanded, setSystemExpanded] = useState<boolean>(false);

  useEffect(() => {
    listAssessments()
      .then(res => setAssessmentCount(res.data.total || 0))
      .catch(() => {});
  }, [location.pathname]);

  const handleWorkspaceChange = (ws: 'doctor' | 'analytics') => {
    if (ws === 'doctor') {
      navigate('/doctor');
    } else {
      navigate('/analytics');
    }
  };

  return (
    <aside className="w-68 bg-slate-900 text-slate-100 border-r border-slate-800 flex flex-col h-screen sticky top-0 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-cyan-900/40">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              MediInsight AI
              <span className="px-1.5 py-0.2 bg-cyan-500/20 text-cyan-400 text-[10px] rounded font-mono font-medium">v2.0</span>
            </div>
            <div className="text-[11px] text-slate-400">Multimodal Health Platform</div>
          </div>
        </div>
      </div>

      {/* Unified Workspace Switcher Control */}
      <div className="p-3 bg-slate-950/60 border-b border-slate-800/80">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
          Active Workspace
        </div>
        <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => handleWorkspaceChange('doctor')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
              activeWorkspace === 'doctor'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Doctor</span>
          </button>

          <button
            onClick={() => handleWorkspaceChange('analytics')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
              activeWorkspace === 'analytics'
                ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-900/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Research</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Scrollable */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-4 text-xs font-medium scrollbar-thin scrollbar-thumb-slate-800">
        
        {/* DOCTOR WORKSPACE SECTION */}
        <div>
          <button
            onClick={() => setDoctorExpanded(!doctorExpanded)}
            className="w-full flex items-center justify-between text-slate-400 hover:text-slate-200 uppercase tracking-wider text-[10px] font-bold px-2 py-1 mb-1"
          >
            <span className="flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-blue-400" /> Doctor Workspace
            </span>
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.2 bg-blue-500/20 text-blue-300 rounded-full text-[10px] font-mono">
                {assessmentCount}
              </span>
              {doctorExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </div>
          </button>

          {doctorExpanded && (
            <ul className="space-y-0.5 mt-1">
              {[
                { to: '/doctor', label: 'Doctor Dashboard', icon: LayoutDashboard, end: true },
                { to: '/doctor/assessment', label: 'New Patient Assessment', icon: UserPlus },
                { to: '/doctor/clinical-analysis', label: 'Clinical Analysis', icon: Microscope },
                { to: '/doctor/recommendations', label: 'Treatment Options', icon: Pill },
                { to: '/doctor/similar-cases', label: 'Similar Patient Cases', icon: Users },
                { to: '/doctor/history', label: 'Assessment History', icon: Clock },
                { to: '/doctor/reports', label: 'Clinical Reports', icon: FileText },
              ].map(item => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all ${
                        isActive
                          ? 'bg-blue-600/90 text-white font-semibold shadow-xs'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4 text-slate-400 group-hover:text-white" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ANALYTICS & RESEARCH SECTION */}
        <div>
          <button
            onClick={() => setAnalyticsExpanded(!analyticsExpanded)}
            className="w-full flex items-center justify-between text-slate-400 hover:text-slate-200 uppercase tracking-wider text-[10px] font-bold px-2 py-1 mb-1"
          >
            <span className="flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-cyan-400" /> Analytics & Research
            </span>
            {analyticsExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>

          {analyticsExpanded && (
            <ul className="space-y-0.5 mt-1">
              {[
                { to: '/analytics/overview', label: 'Healthcare Overview', icon: LayoutDashboard },
                { to: '/analytics/new-assessments', label: 'New Assessment Analytics', icon: Sparkles, badge: 'Live Sync' },
                { to: '/analytics/patients', label: 'Patient Analytics', icon: Users },
                { to: '/analytics/clinical', label: 'Clinical Analytics', icon: Microscope },
                { to: '/analytics/imaging', label: 'Medical Imaging Analytics', icon: Scan },
                { to: '/analytics/treatment', label: 'Treatment Analytics', icon: Pill },
                { to: '/analytics/recommendations', label: 'AI Recommendations', icon: Brain },
                { to: '/analytics/similarity', label: 'Similarity Analytics', icon: GitCompare },
                { to: '/analytics/evaluation', label: 'Model Evaluation', icon: BarChart3 },
                { to: '/analytics/data-quality', label: 'Data Quality Audit', icon: Shield },
                { to: '/analytics/datasets', label: 'Dataset Explorer', icon: Database },
              ].map(item => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-2.5 py-2 rounded-lg transition-all ${
                        isActive
                          ? 'bg-cyan-600/90 text-white font-semibold shadow-xs'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon className="w-4 h-4 text-slate-400" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 text-[9px] rounded font-semibold border border-emerald-500/30">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* SYSTEM SECTION */}
        <div>
          <button
            onClick={() => setSystemExpanded(!systemExpanded)}
            className="w-full flex items-center justify-between text-slate-400 hover:text-slate-200 uppercase tracking-wider text-[10px] font-bold px-2 py-1 mb-1"
          >
            <span className="flex items-center gap-1.5">
              <FolderKanban className="w-3.5 h-3.5 text-slate-400" /> System & Data
            </span>
            {systemExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>

          {systemExpanded && (
            <ul className="space-y-0.5 mt-1">
              {[
                { to: '/system/datasets', label: 'Dataset Management', icon: Database },
                { to: '/system/models', label: 'Model Registry', icon: Brain },
                { to: '/system/settings', label: 'System Settings', icon: Settings },
              ].map(item => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all ${
                        isActive
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          )}
        </div>
      </nav>

      {/* Persistent Storage Status Pill */}
      <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>SQLite Database Active</span>
        </div>
        <span className="font-mono text-slate-500 text-[10px]">Port 8000</span>
      </div>
    </aside>
  );
}
