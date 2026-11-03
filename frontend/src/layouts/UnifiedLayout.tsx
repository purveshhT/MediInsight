import React from 'react';
import { Outlet } from 'react-router-dom';
import { UnifiedSidebar } from './UnifiedSidebar';
import { UnifiedHeader } from './UnifiedHeader';

export function UnifiedLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <UnifiedSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <UnifiedHeader />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
