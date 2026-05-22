'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { MainPanel } from './MainPanel';
import { PanelLeft } from 'lucide-react';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  return (
    <div className="flex h-screen bg-white dark:bg-neutral-950 overflow-hidden">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-sm"
        aria-label="Toggle sidebar"
      >
        <PanelLeft size={16} />
      </button>
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-200 fixed lg:relative z-40 h-full`}>
        <Sidebar />
      </div>
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <MainPanel />
    </div>
  );
}
