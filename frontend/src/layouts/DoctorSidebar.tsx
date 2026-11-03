import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, UserPlus, Microscope, Pill, Users,
  Clock, FileText, ChevronRight, Activity, AlertCircle
} from 'lucide-react';

const navItems = [
  { to: '/doctor', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/doctor/assessment', label: 'New Assessment', icon: UserPlus },
  { to: '/doctor/clinical', label: 'Clinical Analysis', icon: Microscope },
  { to: '/doctor/recommendations', label: 'Recommendations', icon: Pill },
  { to: '/doctor/similar-cases', label: 'Similar Cases', icon: Users },
  { to: '/doctor/history', label: 'Patient History', icon: Clock },
  { to: '/doctor/reports', label: 'Reports', icon: FileText },
];

export function DoctorSidebar() {
  const navigate = useNavigate();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">MediInsight AI</div>
            <div className="text-xs text-blue-600 font-medium">Doctor Workspace</div>
          </div>
        </div>
      </div>

      {/* Research disclaimer */}
      <div className="mx-3 mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700">Research prototype only. Not for clinical use.</p>
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
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={() => navigate('/analytics')}
          className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <span>Switch to Analytics Workspace</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}

