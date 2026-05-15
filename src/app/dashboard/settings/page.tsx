'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SessionManager, SessionState } from '@/lib/session-manager';
import { getSession } from 'next-auth/react';

type Repo = { 
  id: string; 
  repoName: string; 
  repoOwner: string | null;
  autoPrEnabled: boolean; 
  _count?: { failures: number };
  createdAt?: string;
};

export default function SettingsPage() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [repoInput, setRepoInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [isAuth, setIsAuth] = useState(false);
  const [showWebhookGuide, setShowWebhookGuide] = useState(false);
  const [deletingRepo, setDeletingRepo] = useState<string | null>(null);
  const webhookUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/github` : '/api/webhooks/github';
  const webhookSecret = 'GITHUB_WEBHOOK_SECRET';

  useEffect(() => {
    async function load() {
      const nextSession = await getSession();
      const isAuthed = !!nextSession?.user;
      setIsAuth(isAuthed);
      
      const localSess = SessionManager.get();
      localSess.mode = isAuthed ? 'authenticated' : 'guest';
      setSession(localSess);
      
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
    setAdding(true); setAddError(''); setAddSuccess('');
    try {
      const res = await fetch('/api/repositories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoFullName: repoInput, autoPrEnabled: session?.autoPrEnabled ?? true }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      
      if (!isAuth && session) {
        const next = { ...session, repoFullName: data.repoName };
        setSession(next);
        SessionManager.set(next);
      }
      
      setRepos(prev => [data, ...prev.filter(r => r.repoName !== data.repoName)]);
      setRepoInput('');
      setAddSuccess(`✓ ${repoInput} connected successfully!`);
      setTimeout(() => setAddSuccess(''), 3000);
    } catch { setAddError('Failed to add repository.'); }
    finally { setAdding(false); }
  };

  const handleDeleteRepo = async (repoId: string, repoName: string) => {
    if (!confirm(`Remove ${repoName} from Healix?`)) return;
    setDeletingRepo(repoId);
    try {
      const res = await fetch(`/api/repositories/${repoId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      setRepos(prev => prev.filter(r => r.id !== repoId));
    } catch {
      alert('Failed to remove repository');
    } finally {
      setDeletingRepo(null);
    }
  };

  const handleToggleRepoAutoPr = async (repoId: string, currentValue: boolean) => {
    try {
      const res = await fetch(`/api/repositories/${repoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoPrEnabled: !currentValue }),
      });
      if (!res.ok) throw new Error('Failed');
      setRepos(prev => prev.map(r => r.id === repoId ? { ...r, autoPrEnabled: !currentValue } : r));
    } catch {
      alert('Failed to update repository settings');
    }
  };

  if (!session) return null;

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard" className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Settings</h1>
            <p className="text-sm text-slate-500 mt-1">Configure Healix integration and automation</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Quick Start Guide */}
          <section className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl border border-blue-500 shadow-lg p-8 text-white">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-black mb-2">🚀 Quick Start Guide</h2>
                <p className="text-blue-100 text-sm">Get Healix working in 3 simple steps</p>
              </div>
              <span className="px-3 py-1 bg-blue-500/30 rounded-full text-xs font-black uppercase tracking-widest">Setup</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3 font-black text-lg">1</div>
                <h3 className="font-black text-sm mb-2">Add Repository</h3>
                <p className="text-xs text-blue-100">Connect your GitHub repo using the form below</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3 font-black text-lg">2</div>
                <h3 className="font-black text-sm mb-2">Setup Webhook</h3>
                <p className="text-xs text-blue-100">Configure GitHub webhook to detect CI/CD failures</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3 font-black text-lg">3</div>
                <h3 className="font-black text-sm mb-2">Push & Relax</h3>
                <p className="text-xs text-blue-100">Healix auto-fixes failures and creates PRs</p>
              </div>
            </div>
          </section>

          {/* Add Repository */}
          <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-black">Connect GitHub Repository</h2>
                <p className="text-xs text-slate-500">Add repositories to monitor for CI/CD failures</p>
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 mb-6">
              <div className="flex gap-3 mb-3">
                <input
                  value={repoInput}
                  onChange={e => { setRepoInput(e.target.value); setAddError(''); setAddSuccess(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleAddRepo()}
                  placeholder="owner/repository (e.g., facebook/react)"
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-white"
                />
                <button 
                  onClick={handleAddRepo} 
                  disabled={adding || !repoInput}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-100 flex items-center gap-2"
                >
                  {adding ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Adding...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                      </svg>
                      Add Repository
                    </>
                  )}
                </button>
              </div>
              {addError && (
                <div className="flex items-center gap-2 text-rose-600 text-sm bg-rose-50 px-4 py-2 rounded-lg border border-rose-100">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                  </svg>
                  {addError}
                </div>
              )}
              {addSuccess && (
                <div className="flex items-center gap-2 text-emerald-700 text-sm bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  {addSuccess}
                </div>
              )}
            </div>

            {repos.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
                <div className="text-5xl mb-4">📦</div>
                <p className="text-sm font-bold text-slate-400 mb-1">No repositories connected</p>
                <p className="text-xs text-slate-300">Add your first repository above to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {repos.map(r => (
                  <div key={r.id} className="group flex items-center justify-between p-5 bg-slate-50 hover:bg-white rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-900 truncate">{r.repoName}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-slate-500">{r._count?.failures ?? 0} failures tracked</span>
                          <span className="text-xs text-slate-300">•</span>
                          <span className="text-xs text-slate-500">Added {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'recently'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Auto PR</span>
                        <button 
                          onClick={() => handleToggleRepoAutoPr(r.id, r.autoPrEnabled)}
                          className={`w-11 h-6 rounded-full transition-colors relative ${r.autoPrEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        >
                          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${r.autoPrEnabled ? 'translate-x-5' : 'translate-x-0.5'}`}/>
                        </button>
                      </div>
                      <button
                        onClick={() => handleDeleteRepo(r.id, r.repoName)}
                        disabled={deletingRepo === r.id}
                        className="opacity-0 group-hover:opacity-100 p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-50"
                        title="Remove repository"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* GitHub Webhook Setup */}
          <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-black">GitHub Webhook</h2>
                  <p className="text-xs text-slate-500">Automatically detect CI/CD failures</p>
                </div>
              </div>
              <button
                onClick={() => setShowWebhookGuide(!showWebhookGuide)}
                className="px-4 py-2 bg-purple-50 text-purple-700 rounded-xl text-xs font-black hover:bg-purple-100 transition-colors border border-purple-100"
              >
                {showWebhookGuide ? 'Hide Guide' : 'Setup Guide'}
              </button>
            </div>

            {showWebhookGuide && (
              <div className="mb-6 p-6 bg-purple-50 rounded-2xl border border-purple-100">
                <h3 className="font-black text-sm mb-4 text-purple-900">📖 Webhook Setup Instructions</h3>
                <ol className="space-y-3 text-sm text-slate-700">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-black">1</span>
                    <span>Go to your GitHub repository → <strong>Settings</strong> → <strong>Webhooks</strong> → <strong>Add webhook</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-black">2</span>
                    <span>Paste the Payload URL below</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-black">3</span>
                    <span>Set Content type to <code className="px-2 py-0.5 bg-white rounded font-mono text-xs">application/json</code></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-black">4</span>
                    <span>Add your webhook secret (from your <code className="px-2 py-0.5 bg-white rounded font-mono text-xs">.env</code> file)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-black">5</span>
                    <span>Under "Which events?", select <strong>Let me select individual events</strong> → Check <strong>Workflow runs</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-black">6</span>
                    <span>Click <strong>Add webhook</strong> and you're done! 🎉</span>
                  </li>
                </ol>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">Payload URL</label>
                <div className="flex items-center gap-3 bg-slate-50 rounded-xl border border-slate-200 p-4">
                  <code className="flex-1 text-sm font-mono text-slate-800 truncate">{webhookUrl}</code>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(webhookUrl);
                      alert('Webhook URL copied to clipboard!');
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-black hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                    </svg>
                    Copy
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">Content Type</label>
                  <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">
                    <code className="text-sm font-mono text-slate-700">application/json</code>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">Secret (from .env)</label>
                  <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">
                    <code className="text-sm font-mono text-slate-700">{webhookSecret}</code>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                <div className="flex-1">
                  <p className="text-xs font-bold text-amber-900 mb-1">Important: Event Selection</p>
                  <p className="text-xs text-amber-700">Make sure to select <strong>Workflow runs</strong> event only. This ensures Healix receives notifications when CI/CD pipelines fail.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Automation */}
          <section className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-black">Automation Settings</h2>
                <p className="text-xs text-slate-500">Configure how Healix handles fixes</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex-1">
                  <p className="font-bold text-sm text-slate-900 mb-1">Auto PR Creation</p>
                  <p className="text-xs text-slate-500">Automatically create pull requests when AI approves a fix</p>
                </div>
                <button 
                  onClick={handleToggleAutoPr}
                  className={`w-14 h-7 rounded-full transition-colors relative ${session.autoPrEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${session.autoPrEnabled ? 'translate-x-7' : 'translate-x-0.5'}`}/>
                </button>
              </div>
              <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                  </svg>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-blue-900 mb-1">How it works</p>
                    <p className="text-xs text-blue-700">When enabled, Healix will automatically create a pull request with the fix after the AI reviewer approves it. You can then review and merge the PR manually.</p>
                  </div>
                </div>
              </div>
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
