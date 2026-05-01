'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type FailureItem = {
  id: string;
  repoId: string;
  commitSha: string;
  status: string;
  createdAt: string;
  repository: {
    repoName: string;
  };
  analysisRuns: AnalysisRun[];
};

type AnalysisRun = {
  id: string;
  failureId: string;
  rootCause: string;
  category: string;
  confidence: number;
  patch: string | null;
  reviewStatus: string | null;
  prLink: string | null;
  executionTimeMs: number | null;
  createdAt: string;
};

type Stats = {
  totalRuns: number;
  approvedRuns: number;
  successRate: number;
  avgExecutionTimeMs: number;
  avgConfidence: string;
  prsCreated: number;
};

export default function DashboardPage() {
  const [failures, setFailures] = useState<FailureItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedFailureId, setSelectedFailureId] = useState<string | null>(null);
  const [analysisRuns, setAnalysisRuns] = useState<AnalysisRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFailures();
    fetchStats();
  }, []);

  useEffect(() => {
    if (selectedFailureId) {
      fetchAnalysisRuns(selectedFailureId);
    }
  }, [selectedFailureId]);

  const fetchFailures = async () => {
    try {
      const res = await fetch('/api/failures');
      const data = await res.json();
      setFailures(data);
      if (data.length > 0 && !selectedFailureId) {
        setSelectedFailureId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnalysisRuns = async (id: string) => {
    try {
      const res = await fetch(`/api/analysis-runs?failureId=${id}`);
      const data = await res.json();
      setAnalysisRuns(data);
    } catch (err) {
      console.error(err);
    }
  };

  const selectedFailure = failures.find((f) => f.id === selectedFailureId);
  const latestRun = analysisRuns[0];

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <header className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Healix Control Center</h1>
            <p className="text-slate-500 mt-1">Phase 2: Autonomous Fix Pipeline</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => { fetchFailures(); fetchStats(); }}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
            >
              Refresh Data
            </button>
            <Link href="/" className="px-4 py-2 bg-sky-600 text-white rounded-xl text-sm font-medium hover:bg-sky-700 transition-colors shadow-sm shadow-sky-100">
              Back Home
            </Link>
          </div>
        </header>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Stats Section - Top row */}
          <div className="md:col-span-3 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Fix Success Rate</p>
            <h3 className="text-4xl font-bold mt-2 text-sky-600">{stats?.successRate ?? 0}%</h3>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-4">
              <div className="bg-sky-500 h-2 rounded-full" style={{ width: `${stats?.successRate ?? 0}%` }}></div>
            </div>
          </div>

          <div className="md:col-span-3 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Avg Resolution Time</p>
            <h3 className="text-4xl font-bold mt-2 text-slate-800">{((stats?.avgExecutionTimeMs ?? 0) / 1000).toFixed(1)}s</h3>
            <p className="text-xs text-slate-400 mt-2">End-to-end pipeline execution</p>
          </div>

          <div className="md:col-span-3 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">AI Confidence Score</p>
            <h3 className="text-4xl font-bold mt-2 text-emerald-600">{stats?.avgConfidence ?? '0.00'}</h3>
            <p className="text-xs text-slate-400 mt-2">Average over {stats?.totalRuns ?? 0} runs</p>
          </div>

          <div className="md:col-span-3 bg-slate-900 p-6 rounded-3xl shadow-lg text-white">
            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Auto PRs Created</p>
            <h3 className="text-4xl font-bold mt-2">{stats?.prsCreated ?? 0}</h3>
            <p className="text-xs text-slate-400 mt-2">Fully autonomous suggestions</p>
          </div>

          {/* Left Column: Failure Feed */}
          <div className="md:col-span-4 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-bottom border-slate-50">
              <h2 className="text-lg font-bold">Failure Feed</h2>
              <p className="text-sm text-slate-500">Live CI/CD events</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[600px]">
              {loading ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-50 rounded-2xl"></div>)}
                </div>
              ) : failures.length === 0 ? (
                <p className="text-center py-10 text-slate-400 text-sm">No failures detected.</p>
              ) : (
                failures.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFailureId(f.id)}
                    className={`w-full p-4 text-left rounded-2xl border transition-all ${
                      selectedFailureId === f.id 
                        ? 'border-sky-200 bg-sky-50 ring-1 ring-sky-100' 
                        : 'border-slate-50 bg-slate-50/50 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md">
                        {f.commitSha.slice(0, 7)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(f.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="mt-2 font-semibold text-sm truncate">{f.repository.repoName}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${f.status === 'analyzed' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                      <span className="text-xs text-slate-500 capitalize">{f.status}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Pipeline Details */}
          <div className="md:col-span-8 space-y-6">
            
            {/* AI Fix Pipeline View */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">🧠 AI Fix Pipeline</h2>
                    <p className="text-sm text-slate-500">Autonomous analysis & patch generation</p>
                  </div>
                </div>
                {latestRun && (
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    latestRun.reviewStatus === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    Review: {latestRun.reviewStatus}
                  </span>
                )}
              </div>

              {!selectedFailureId ? (
                <div className="py-20 text-center text-slate-400">Select a failure to view pipeline details</div>
              ) : !latestRun ? (
                <div className="py-20 text-center text-slate-400">No analysis runs for this failure yet.</div>
              ) : (
                <div className="space-y-8">
                  {/* Root Cause */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Root Cause Analysis</h4>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-sm leading-relaxed text-slate-700">
                      {latestRun.rootCause}
                    </div>
                  </div>

                  {/* Patch Preview */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Generated Patch</h4>
                    <div className="bg-[#1E293B] p-5 rounded-2xl shadow-inner overflow-x-auto">
                      <pre className="text-xs text-slate-300 font-mono leading-6">
                        {latestRun.patch || 'No patch generated.'}
                      </pre>
                    </div>
                  </div>

                  {/* PR Section */}
                  {latestRun.prLink && (
                    <div className="flex items-center justify-between p-4 bg-sky-50 rounded-2xl border border-sky-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-sky-200 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-sky-700" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M11 19a2 2 0 10-4 0 2 2 0 004 0zM7 16a4.001 4.001 0 01-3.874-3H3.5a1.5 1.5 0 010-3h.626A4.001 4.001 0 017 7c.484 0 .935.093 1.355.253A4 4 0 0113 5a4 4 0 014 4c0 .484-.093.935-.253 1.355A4 4 0 0121 13a4 4 0 01-4 4h-.126a4.001 4.001 0 01-3.874 3 2 2 0 10-4 0zM7 9a2 2 0 100 4 2 2 0 000-4zm10 4a2 2 0 100-4 2 2 0 000 4z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-sky-900">Pull Request Created</p>
                          <p className="text-xs text-sky-700">Healix has automatically proposed a fix</p>
                        </div>
                      </div>
                      <a 
                        href={latestRun.prLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-white border border-sky-200 text-sky-700 rounded-xl text-xs font-bold hover:bg-sky-100 transition-colors"
                      >
                        View Pull Request
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Auto PR History Section */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
                Auto PR History
              </h2>
              <div className="space-y-4">
                {failures.filter(f => f.analysisRuns.some(r => r.prLink)).length === 0 ? (
                  <p className="text-sm text-slate-400 italic">No automated PRs yet.</p>
                ) : (
                  failures.filter(f => f.analysisRuns.some(r => r.prLink)).slice(0, 5).map(f => (
                    <div key={f.id} className="flex items-center justify-between p-4 border border-slate-50 rounded-2xl hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="font-mono text-xs text-slate-400">{f.commitSha.slice(0, 7)}</div>
                        <div>
                          <div className="text-sm font-semibold">{f.repository.repoName}</div>
                          <div className="text-xs text-slate-400">{new Date(f.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-sky-50 text-sky-700 rounded-full text-[10px] font-bold uppercase">Open</span>
                        <a href={f.analysisRuns[0].prLink!} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:text-sky-800">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
