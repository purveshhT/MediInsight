import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Microscope, Scan, Pill,
  Brain, GitCompare, BarChart3, Shield, Database,
  ChevronLeft, TrendingUp
} from 'lucide-react';

const navItems = [
  { to: '/analytics', label: 'Healthcare Overview', icon: LayoutDashboard, end: true },
  { to: '/analytics/patient', label: 'Patient Analytics', icon: Users },
  { to: '/analytics/clinical', label: 'Clinical Analytics', icon: Microscope },
  { to: '/analytics/imaging', label: 'Medical Imaging', icon: Scan },
  { to: '/analytics/treatment', label: 'Treatment Analytics', icon: Pill },
  { to: '/analytics/ai-recommendations', label: 'AI Recommendations', icon: Brain },
  { to: '/analytics/similarity', label: 'Similarity Analytics', icon: GitCompare },
  { to: '/analytics/model-evaluation', label: 'Model Evaluation', icon: BarChart3 },
  { to: '/analytics/data-quality', label: 'Data Quality', icon: Shield },
  { to: '/analytics/dataset-explorer', label: 'Dataset Explorer', icon: Database },
];

export function AnalyticsSidebar() {
  const navigate = useNavigate();

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-cyan-500 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">MediInsight AI</div>
            <div className="text-xs text-cyan-400 font-medium">Analytics Workspace</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-0.5 px-2">
          {navItems.map(item => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-cyan-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Switch workspace */}
      <div className="p-3 border-t border-slate-700">
        <button
          onClick={() => navigate('/doctor')}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Switch to Doctor Workspace</span>
        </button>
      </div>
    </aside>
  );
}

