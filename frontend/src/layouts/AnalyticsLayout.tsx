import React from 'react';
import { Outlet } from 'react-router-dom';
import { AnalyticsSidebar } from './AnalyticsSidebar';

export function AnalyticsLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AnalyticsSidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

