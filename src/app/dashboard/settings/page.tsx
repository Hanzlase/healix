'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SessionManager, SessionState } from '@/lib/session-manager';
import { getSession } from 'next-auth/react';

type Repo = { id: string; repoName: string; autoPrEnabled: boolean; _count?: { failures: number } };

export default function SettingsPage() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [repoInput, setRepoInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [isAuth, setIsAuth] = useState(false);
  const webhookUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/github` : '/api/webhooks/github';

  useEffect(() => {
    async function load() {
      const nextSession = await getSession();
      const isAuthed = !!nextSession?.user;
      setIsAuth(isAuthed);
      
      const localSess = SessionManager.get();
      localSess.mode = isAuthed ? 'authenticated' : 'guest';
      setSession(localSess);
      
      const url = isAuthed 
        ? '/api/repositories'
        : `/api/repositories?repos=${encodeURIComponent(localSess.recentFailures.join(','))}`; // Wait, repos are not in recentFailures, they are in a different place. 
        // Actually, we don't have a list of guest repos stored. We can store it in SessionManager.

      // For now, let's just fetch without repos param and let it return empty if guest, or we can just fetch everything we have.
      // We will enhance SessionManager below.
      const res = await fetch(`/api/repositories?repos=${encodeURIComponent(localSess.repoFullName || '')}`);
      const data = await res.json();
      setRepos(Array.isArray(data) ? data : []);
    }
    load();
  }, []);

  const handleToggleAutoPr = () => {
    if (!session) return;
    const next = { ...session, autoPrEnabled: !session.autoPrEnabled };
    setSession(next);
    SessionManager.set(next);
  };

  const handleReset = () => {
    if (confirm('Reset all local session data?')) { SessionManager.reset(); window.location.reload(); }
  };

  const handleExport = () => SessionManager.exportData();

  const handleAddRepo = async () => {
    if (!repoInput.includes('/')) { setAddError('Format: owner/repo'); return; }
    setAdding(true); setAddError('');
    try {
      const res = await fetch('/api/repositories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoFullName: repoInput, autoPrEnabled: session?.autoPrEnabled ?? true }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      
      if (!isAuth && session) {
        // If guest, store the repo locally
        const next = { ...session, repoFullName: data.repoName };
        setSession(next);
        SessionManager.set(next);
      }
      
      setRepos(prev => [data, ...prev.filter(r => r.repoName !== data.repoName)]);
      setRepoInput('');
    } catch { setAddError('Failed to add repository.'); }
    finally { setAdding(false); }
  };

  if (!session) return null;

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard" className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Settings</h1>
            <p className="text-xs text-slate-400 mt-0.5">Configure Healix integration and automation</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Webhook */}
          <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-7">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-5">GitHub Webhook</h2>
            <p className="text-xs text-slate-500 mb-3">Add this URL in your GitHub repo → Settings → Webhooks. Select <strong>workflow_run</strong> events.</p>
            <div className="flex items-center gap-3 bg-slate-50 rounded-xl border border-slate-200 p-3">
              <code className="flex-1 text-xs font-mono text-slate-700 truncate">{webhookUrl}</code>
              <button onClick={() => navigator.clipboard.writeText(webhookUrl)} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 px-2 py-1 bg-blue-50 rounded-lg border border-blue-100 transition-colors">Copy</button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">Content type: <code className="font-mono">application/json</code> · Secret: your <code className="font-mono">GITHUB_WEBHOOK_SECRET</code></p>
          </section>

          {/* Repos */}
          <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-7">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-5">Linked Repositories</h2>
            <div className="flex gap-3 mb-4">
              <input
                value={repoInput}
                onChange={e => setRepoInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddRepo()}
                placeholder="owner/repository"
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-slate-50"
              />
              <button onClick={handleAddRepo} disabled={adding} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-blue-700 transition-all disabled:opacity-50 shadow-sm shadow-blue-100">
                {adding ? '…' : 'Add'}
              </button>
            </div>
            {addError && <p className="text-xs text-rose-500 mb-3">{addError}</p>}
            {repos.length === 0
              ? <p className="text-sm text-slate-300 text-center py-8">No repositories linked yet</p>
              : <div className="space-y-2">{repos.map(r => (
                <div key={r.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{r.repoName}</p>
                    <p className="text-[10px] text-slate-400">{r._count?.failures ?? 0} failures tracked</p>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">Active</span>
                </div>
              ))}</div>
            }
          </section>

          {/* Automation */}
          <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-7">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-5">Automation</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">Auto PR Creation</p>
                <p className="text-xs text-slate-400 mt-0.5">Open PRs automatically when a fix is approved</p>
              </div>
              <button onClick={handleToggleAutoPr} className={`w-12 h-6 rounded-full transition-colors relative ${session.autoPrEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${session.autoPrEnabled ? 'translate-x-6' : 'translate-x-0.5'}`}/>
              </button>
            </div>
          </section>

          {/* Danger zone */}
          <section className="bg-white rounded-3xl border border-rose-100 shadow-sm p-7">
            <h2 className="text-sm font-black uppercase tracking-widest text-rose-400 mb-5">Danger Zone</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border border-slate-100 rounded-2xl">
                <p className="font-bold text-sm mb-1">Export Data</p>
                <p className="text-xs text-slate-400 mb-3">Download session JSON</p>
                <button onClick={handleExport} className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-colors">Export JSON</button>
              </div>
              <div className="p-4 border border-rose-100 bg-rose-50/30 rounded-2xl">
                <p className="font-bold text-sm mb-1 text-rose-900">Reset Session</p>
                <p className="text-xs text-rose-700/60 mb-3">Clear all local data</p>
                <button onClick={handleReset} className="w-full py-2 bg-rose-600 text-white rounded-xl text-xs font-black hover:bg-rose-700 transition-colors">Reset</button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
