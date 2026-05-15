'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { SessionManager } from '@/lib/session-manager';
import { getSession } from 'next-auth/react';

type AnalysisRun = {
  id: string; failureId: string; rootCause: string; category: string;
  confidence: number; affectedFile: string | null; patch: string | null;
  reviewStatus: string | null; reviewReason: string | null; reviewRiskLevel: string | null;
  prLink: string | null; prBranch: string | null; executionTimeMs: number | null;
  pipelineStage: string | null; createdAt: string;
};

type FailureItem = {
  id: string; repoId: string; commitSha: string; status: string;
  workflowName: string | null; branchName: string | null; errorSummary: string | null;
  createdAt: string;
  repository: { id: string; repoName: string; repoOwner: string | null; autoPrEnabled: boolean };
  analysisRuns: AnalysisRun[];
};

type Stats = {
  totalRuns: number; approvedRuns: number; successRate: number;
  avgExecutionTimeMs: number; avgConfidence: string; prsCreated: number;
};

type Analytics = {
  totalFailures: number; rejectionRate: number;
  categoryBreakdown: Record<string, number>;
  riskLevelBreakdown: Record<string, number>;
};

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-400',
  analyzing: 'bg-blue-400 animate-pulse',
  analyzed: 'bg-emerald-500',
  failed: 'bg-rose-500',
};

const CATEGORY_ICON: Record<string, string> = {
  runtime: '⚡', build: '🔨', dependency: '📦', config: '⚙️',
};

export default function DashboardPage() {
  const [failures, setFailures] = useState<FailureItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [healing, setHealing] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const nextSession = await getSession();
      const isAuthed = !!nextSession?.user;
      const localSess = SessionManager.get();

      const urlSuffix = isAuthed ? '' : `?repos=${encodeURIComponent(localSess.repoFullName || '')}`;

      const [fRes, sRes, aRes] = await Promise.all([
        fetch(`/api/failures${urlSuffix}`),
        fetch(`/api/stats${urlSuffix}`),
        fetch(`/api/analytics${urlSuffix}`),
      ]);
      const fData = await fRes.json();
      const sData = await sRes.json();
      const aData = await aRes.json();

      const items: FailureItem[] = fData.failures ?? [];

      if (!isAuthed) {
        SessionManager.update({ 
          recentFailures: items.map(f => f.id),
          failuresCache: items,
          statsCache: sData,
          analyticsCache: aData
        });
      }

      setFailures(items);
      setStats(sData);
      setAnalytics(aData);
      setSelectedId(prev => {
        if (prev && items.find(f => f.id === prev)) return prev;
        return items.length > 0 ? items[0].id : null;
      });
    } catch (e) {
      console.error(e);
      const localSess = SessionManager.get();
      if (localSess.failuresCache?.length) {
        setFailures(localSess.failuresCache);
        if (localSess.statsCache) setStats(localSess.statsCache);
        if (localSess.analyticsCache) setAnalytics(localSess.analyticsCache);
        setSelectedId(prev => prev ?? localSess.failuresCache![0]?.id ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, []); // stable — no deps that change

  useEffect(() => {
    fetchAll();
    const iv = setInterval(fetchAll, 15000);
    return () => clearInterval(iv);
  }, [fetchAll]);

  const selected = failures.find(f => f.id === selectedId);
  const latestRun = selected?.analysisRuns?.[0];

  const triggerHeal = async () => {
    if (!selected) return;
    setHealing(true);
    try {
      const [owner, repo] = selected.repository.repoName.split('/');
      await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          failureId: selected.id,
          owner, repo,
          workflowRunId: 1,
          commitSha: selected.commitSha,
        }),
      });
      await fetchAll();
    } finally {
      setHealing(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      {/* Navbar */}
      <nav className="bg-white/90 backdrop-blur-xl border-b border-slate-100 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100 group-hover:rotate-12 transition-transform">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <span className="text-xl font-black tracking-tight">Healix</span>
            </Link>
            <div className="hidden lg:flex items-center gap-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">
              <span className="text-blue-600 border-b-2 border-blue-600 pb-0.5">Overview</span>
              <Link href="/dashboard/settings" className="hover:text-slate-800 transition-colors">Settings</Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"/>
              Live
            </div>
            <Link href="/dashboard/settings" className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-white transition-colors">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Metrics row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard label="Total Analyzed" value={stats?.totalRuns ?? 0} sub="Pipeline runs processed" icon="📊"/>
          <MetricCard label="Fix Success Rate" value={`${stats?.successRate ?? 0}%`} sub="AI patches approved" positive icon="✅"/>
          <MetricCard label="Avg MTTR" value={`${((stats?.avgExecutionTimeMs ?? 0)/1000).toFixed(1)}s`} sub="Mean recovery time" icon="⏱"/>
          <MetricCard label="Auto PRs" value={stats?.prsCreated ?? 0} sub="Autonomous pull requests" highlight icon="🔗"/>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Failure Feed */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-[820px] flex flex-col">
              <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                <h2 className="text-base font-black tracking-tight">Failure Feed</h2>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{failures.length} events</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                  <div className="space-y-3 animate-pulse">
                    {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-50 rounded-2xl border border-slate-100"/>)}
                  </div>
                ) : failures.length === 0 ? (
                  <div className="py-16 text-center">
                    <p className="text-4xl mb-3">🔍</p>
                    <p className="text-sm font-bold text-slate-400">No failures yet</p>
                    <p className="text-xs text-slate-300 mt-1">Connect a GitHub repo to start</p>
                  </div>
                ) : (
                  failures.map(f => (
                    <FailureCard key={f.id} f={f} selected={selectedId===f.id} onClick={() => setSelectedId(f.id)}/>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-8 space-y-6">
            {/* Pipeline Flow */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">AI Pipeline</p>
                  <h2 className="text-2xl font-black tracking-tight">
                    {selected ? selected.repository.repoName.split('/')[1] ?? selected.repository.repoName : 'Select a failure'}
                  </h2>
                </div>
                {selected && selected.status === 'pending' && (
                  <button
                    onClick={triggerHeal}
                    disabled={healing}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-100"
                  >
                    {healing ? 'Healing…' : '⚡ Heal Now'}
                  </button>
                )}
                {latestRun && (
                  <span className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border ${
                    latestRun.reviewStatus === 'approved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : latestRun.reviewStatus === 'rejected'
                      ? 'bg-rose-50 text-rose-700 border-rose-100'
                      : 'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                    {latestRun.reviewStatus ?? selected?.status ?? 'pending'}
                  </span>
                )}
              </div>

              {!selected ? (
                <div className="py-16 border-2 border-dashed border-slate-100 rounded-2xl text-center">
                  <p className="text-slate-400 text-sm font-bold">Select a failure to view its trace</p>
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-3">
                  {[
                    { label: 'Detect', done: true },
                    { label: 'Gemini', done: !!latestRun },
                    { label: 'GPT-OSS', done: !!latestRun?.patch },
                    { label: 'Review', done: !!latestRun?.reviewStatus },
                    { label: 'PR', done: !!latestRun?.prLink },
                  ].map((step, i) => (
                    <PipelineStep key={i} label={step.label} done={step.done} active={step.done}/>
                  ))}
                </div>
              )}
            </div>

            {/* Analysis */}
            {latestRun && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                <h3 className="text-base font-black mb-6 flex items-center gap-2">
                  <span className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-sm">🧠</span>
                  AI Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <InfoChip label="Category" value={`${CATEGORY_ICON[latestRun.category] ?? '?'} ${latestRun.category}`}/>
                  <InfoChip label="Confidence" value={`${(latestRun.confidence * 100).toFixed(0)}%`}/>
                  <InfoChip label="Risk Level" value={latestRun.reviewRiskLevel ?? '—'}/>
                </div>
                <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 mb-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Root Cause</p>
                  <p className="text-slate-800 font-semibold text-sm leading-relaxed">{latestRun.rootCause}</p>
                </div>
                {latestRun.reviewReason && (
                  <div className={`rounded-2xl border p-4 mb-6 ${latestRun.reviewStatus === 'approved' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1 ${latestRun.reviewStatus === 'approved' ? 'text-emerald-600' : 'text-rose-600'}">Reviewer Verdict</p>
                    <p className="text-sm font-semibold text-slate-700">{latestRun.reviewReason}</p>
                  </div>
                )}
                {latestRun.patch && (
                  <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                    <div className="bg-[#0F172A] px-5 py-3 flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patch Diff</span>
                      <div className="flex gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500/50"/>
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/50"/>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/50"/>
                      </div>
                    </div>
                    <div className="bg-[#0F172A] p-5 overflow-x-auto max-h-80">
                      <pre className="text-xs font-mono leading-relaxed">
                        {latestRun.patch.split('\n').map((line, i) => (
                          <div key={i} className={`py-0.5 ${line.startsWith('+') ? 'text-emerald-400' : line.startsWith('-') ? 'text-rose-400' : 'text-slate-500'}`}>
                            {line}
                          </div>
                        ))}
                      </pre>
                    </div>
                  </div>
                )}
                {latestRun.prLink && (
                  <div className="mt-6 p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
                    <div>
                      <p className="font-black text-blue-900 text-sm">Pull Request Opened</p>
                      <p className="text-xs text-blue-700/70 mt-0.5">Branch: {latestRun.prBranch ?? 'healix/fix'}</p>
                    </div>
                    <a href={latestRun.prLink} target="_blank" rel="noreferrer"
                      className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md shadow-blue-100">
                      View PR
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Analytics bottom row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-7">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">Category Breakdown</p>
                <div className="space-y-3">
                  {analytics && Object.keys(analytics.categoryBreakdown).length > 0
                    ? Object.entries(analytics.categoryBreakdown).map(([cat, count]) => (
                      <div key={cat} className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-600">{CATEGORY_ICON[cat]} {cat}</span>
                        <span className="text-xs font-black text-slate-900">{count}</span>
                      </div>
                    ))
                    : <p className="text-sm text-slate-300 text-center py-4">No data yet</p>
                  }
                </div>
              </div>
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-7">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">Risk Distribution</p>
                <div className="space-y-3">
                  {analytics && Object.keys(analytics.riskLevelBreakdown).length > 0
                    ? Object.entries(analytics.riskLevelBreakdown).map(([risk, count]) => {
                      const colors: Record<string,string> = { low:'text-emerald-600', medium:'text-amber-600', high:'text-rose-600' };
                      return (
                        <div key={risk} className="flex items-center justify-between">
                          <span className={`text-xs font-semibold capitalize ${colors[risk] ?? 'text-slate-600'}`}>{risk}</span>
                          <span className="text-xs font-black text-slate-900">{count}</span>
                        </div>
                      );
                    })
                    : <p className="text-sm text-slate-300 text-center py-4">No data yet</p>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function MetricCard({ label, value, sub, icon, highlight, positive }: {
  label: string; value: string | number; sub: string; icon: string;
  highlight?: boolean; positive?: boolean;
}) {
  return (
    <div className={`p-6 rounded-3xl border transition-all hover:shadow-lg ${highlight ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-100'}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl">{icon}</span>
        {positive && <span className="w-2 h-2 rounded-full bg-emerald-400 shadow shadow-emerald-200"/>}
      </div>
      <p className="text-3xl font-black tracking-tight mb-1">{value}</p>
      <p className={`text-[10px] font-black uppercase tracking-widest ${highlight ? 'text-slate-400' : 'text-slate-800'}`}>{label}</p>
      <p className={`text-[10px] mt-0.5 ${highlight ? 'text-slate-500' : 'text-slate-400'}`}>{sub}</p>
    </div>
  );
}

function FailureCard({ f, selected, onClick }: { f: FailureItem; selected: boolean; onClick: () => void }) {
  const run = f.analysisRuns?.[0];
  return (
    <button onClick={onClick}
      className={`w-full p-5 text-left rounded-2xl border transition-all duration-200 ${selected ? 'bg-white border-blue-200 shadow-lg ring-1 ring-blue-50 scale-[1.01]' : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-md'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-black ${selected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
          {f.commitSha.slice(0, 7)}
        </span>
        <span className="text-[10px] text-slate-400">{new Date(f.createdAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
      </div>
      <p className="font-black text-sm text-slate-900 truncate mb-1">{f.repository.repoName.split('/').pop()}</p>
      {f.workflowName && <p className="text-[10px] text-slate-400 truncate mb-2">{f.workflowName}</p>}
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLOR[f.status] ?? 'bg-slate-300'}`}/>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {run?.reviewStatus ?? f.status}
        </span>
        {run?.prLink && <span className="ml-auto text-blue-500 text-xs">PR ↗</span>}
      </div>
    </button>
  );
}

function PipelineStep({ label, done, active }: { label: string; done: boolean; active: boolean }) {
  return (
    <div className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${active ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100 opacity-40'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${done ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'bg-slate-200 text-slate-400'}`}>
        {done ? '✓' : '·'}
      </div>
      <span className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-blue-600' : 'text-slate-400'}`}>{label}</span>
    </div>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-xl border border-slate-100 p-3">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm font-black text-slate-800 capitalize">{value}</p>
    </div>
  );
}
