'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SessionManager, SessionState } from '@/lib/session-manager';

export default function SettingsPage() {
  const [session, setSession] = useState<SessionState | null>(null);

  useEffect(() => {
    setSession(SessionManager.get());
  }, []);

  const handleToggleAutoPr = () => {
    if (!session) return;
    const next = { ...session, autoPrEnabled: !session.autoPrEnabled };
    setSession(next);
    SessionManager.set(next);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all session data? This cannot be undone.')) {
      SessionManager.reset();
      window.location.reload();
    }
  };

  const handleExport = () => {
    SessionManager.exportData();
  };

  if (!session) return null;

  return (
    <main className="min-h-screen bg-[#F9FAFB] text-slate-900 font-sans">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex items-center gap-4 mb-10">
          <Link href="/dashboard" className="p-2 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-slate-200">
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        </div>

        <div className="space-y-6">
          {/* GitHub Section */}
          <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h2 className="text-xl font-bold mb-6">GitHub Configuration</h2>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-200">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold">Linked Repositories</p>
                  <p className="text-sm text-slate-500">Manage which repos Healix can access</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">
                Manage Access
              </button>
            </div>
          </section>

          {/* Automation Section */}
          <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h2 className="text-xl font-bold mb-6">Automation Pipeline</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">Autonomous PR Creation</p>
                  <p className="text-sm text-slate-500">Automatically open PRs when a fix is approved by AI</p>
                </div>
                <button 
                  onClick={handleToggleAutoPr}
                  className={`w-14 h-8 rounded-full transition-colors relative ${session.autoPrEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${session.autoPrEnabled ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>
            </div>
          </section>

          {/* Data Management */}
          <section className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h2 className="text-xl font-bold mb-6 text-rose-600">Danger Zone</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 border border-slate-100 rounded-2xl">
                <p className="font-bold mb-1">Export Session Data</p>
                <p className="text-sm text-slate-500 mb-4">Download your guest session history as JSON</p>
                <button 
                  onClick={handleExport}
                  className="w-full py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors"
                >
                  Export JSON
                </button>
              </div>
              <div className="p-6 border border-rose-100 bg-rose-50/30 rounded-2xl">
                <p className="font-bold mb-1 text-rose-900">Reset Session</p>
                <p className="text-sm text-rose-700/60 mb-4">Clear all local data and start fresh</p>
                <button 
                  onClick={handleReset}
                  className="w-full py-2 bg-rose-600 text-white rounded-xl text-sm font-bold hover:bg-rose-700 transition-colors shadow-sm shadow-rose-100"
                >
                  Reset Everything
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
