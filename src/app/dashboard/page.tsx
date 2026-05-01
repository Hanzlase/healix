'use client';

import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { SessionManager, SessionState } from '@/lib/session-manager';

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
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionState | null>(null);

  useEffect(() => {
    const s = SessionManager.get();
    setSession(s);
    fetchFailures();
    fetchStats();
    
    // Auto-refresh every 30s
    const interval = setInterval(() => {
      fetchFailures();
      fetchStats();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

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

  const selectedFailure = failures.find((f) => f.id === selectedFailureId);
  const latestRun = selectedFailure?.analysisRuns?.[0];

  return (
    <main className="min-h-screen bg-[#F9FAFB] text-slate-900 font-sans pb-20">
      {/* Sidebar / Nav */}
      <nav className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight">Healix</span>
            </Link>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-500">
              <Link href="/dashboard" className="text-blue-600">Overview</Link>
              <Link href="/dashboard/settings" className="hover:text-slate-900 transition-colors">Settings</Link>
              <a href="https://github.com/Hanzlase/healix" target="_blank" className="hover:text-slate-900 transition-colors">Documentation</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">System Live</span>
            </div>
            <Link href="/dashboard/settings" className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center hover:bg-slate-200 transition-colors">
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto px-6 mt-8">
        {/* SECTION 1: SYSTEM OVERVIEW */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Failures Processed" value={stats?.totalRuns ?? 0} subtitle="Across all connected repos" />
          <StatCard title="Fix Success Rate" value={`${stats?.successRate ?? 0}%`} subtitle="Approved patches by GPT-OSS" trend={+5} />
          <StatCard title="Avg MTTR Reduction" value="64%" subtitle="Time saved vs manual fixing" positive />
          <StatCard title="Active Repositories" value={failures.reduce((acc, f) => acc.add(f.repository.repoName), new Set()).size} subtitle="Connected via Webhooks" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Failure Feed (SECTION 3) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[800px]">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <h2 className="text-lg font-bold">Failure Feed</h2>
                <span className="text-xs font-bold text-slate-400 uppercase">{failures.length} Events</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                  <LoadingList />
                ) : failures.length === 0 ? (
                  <EmptyState />
                ) : (
                  failures.map((f) => (
                    <FailureCard 
                      key={f.id} 
                      failure={f} 
                      isSelected={selectedFailureId === f.id} 
                      onClick={() => setSelectedFailureId(f.id)} 
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Pipeline & Fixes (SECTION 2, 4, 5) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* SECTION 2: AI PIPELINE INSPECTOR */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
              <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                AI Pipeline Inspector
              </h2>
              
              {!selectedFailure ? (
                <p className="text-center py-20 text-slate-400">Select a failure to inspect the pipeline</p>
              ) : (
                <div className="relative">
                  {/* Vertical Line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100"></div>
                  
                  <div className="space-y-10 relative">
                    <PipelineStep 
                      title="Failure Detection" 
                      status="success" 
                      description="Webhook received from GitHub Actions" 
                      time={selectedFailure.createdAt}
                    />
                    <PipelineStep 
                      title="Gemini Root Cause Analysis" 
                      status={latestRun ? 'success' : 'pending'} 
                      description={latestRun?.category || 'Analyzing logs...'} 
                      confidence={latestRun?.confidence}
                    />
                    <PipelineStep 
                      title="GPT-OSS Patch Generation" 
                      status={latestRun?.patch ? 'success' : latestRun ? 'pending' : 'waiting'} 
                      description={latestRun?.patch ? 'Code patch generated' : 'Waiting for analysis...'} 
                    />
                    <PipelineStep 
                      title="Patch Review & Validation" 
                      status={latestRun?.reviewStatus === 'approved' ? 'success' : latestRun?.reviewStatus === 'rejected' ? 'fail' : 'pending'} 
                      description={latestRun?.reviewStatus ? `Verdict: ${latestRun.reviewStatus}` : 'Validating fix...'} 
                    />
                    <PipelineStep 
                      title="GitHub PR Automation" 
                      status={latestRun?.prLink ? 'success' : 'pending'} 
                      description={latestRun?.prLink ? 'Pull Request opened' : 'Finalizing...'} 
                      isLast
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 4: AI GENERATED FIXES */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold">AI Generated Fix</h2>
                {latestRun?.reviewStatus && (
                   <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    latestRun.reviewStatus === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    Reviewer: {latestRun.reviewStatus}
                  </span>
                )}
              </div>

              {latestRun ? (
                <div className="space-y-6">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h4 className="text-xs font-black text-slate-400 uppercase mb-2 tracking-widest">Analysis Result</h4>
                    <p className="text-slate-700 leading-relaxed font-medium">{latestRun.rootCause}</p>
                  </div>
                  
                  <div className="rounded-2xl overflow-hidden border border-slate-200">
                    <div className="bg-slate-900 px-4 py-2 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Patch Diff Viewer</span>
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      </div>
                    </div>
                    <div className="bg-[#0f172a] p-6 overflow-x-auto max-h-[400px]">
                      <pre className="text-xs font-mono leading-relaxed">
                        {latestRun.patch?.split('\n').map((line, i) => (
                          <div key={i} className={`${line.startsWith('+') ? 'text-emerald-400 bg-emerald-950/30' : line.startsWith('-') ? 'text-rose-400 bg-rose-950/30' : 'text-slate-400'}`}>
                            {line}
                          </div>
                        ))}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-slate-400 italic">Analysis in progress...</div>
              )}
            </div>

            {/* AI Performance Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  AI Model Precision
                </h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 font-medium">Gemini Accuracy</span>
                    <span className="text-sm font-bold text-slate-900">98.2%</span>
                  </div>
                  <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full" style={{ width: '98.2%' }}></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 font-medium">GPT-OSS Approval Rate</span>
                    <span className="text-sm font-bold text-slate-900">{stats?.successRate ?? 0}%</span>
                  </div>
                  <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${stats?.successRate ?? 0}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Common Rejection Reasons
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-xs font-bold text-slate-600 tracking-tight">Security Vulnerability</span>
                    <span className="text-xs font-black text-slate-400">12%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-xs font-bold text-slate-600 tracking-tight">Scope Overflow</span>
                    <span className="text-xs font-black text-slate-400">45%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-xs font-bold text-slate-600 tracking-tight">Style Inconsistency</span>
                    <span className="text-xs font-black text-slate-400">28%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 5: PULL REQUESTS */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
               <h2 className="text-xl font-bold mb-6">Autonomous PR History</h2>
               <div className="space-y-4">
                  {failures.filter(f => f.analysisRuns.some(r => r.prLink)).length === 0 ? (
                    <div className="py-10 text-center text-slate-400 text-sm">No pull requests created yet.</div>
                  ) : (
                    failures.filter(f => f.analysisRuns.some(r => r.prLink)).map(f => (
                      <div key={f.id} className="flex items-center justify-between p-5 border border-slate-50 bg-slate-50/30 rounded-2xl hover:bg-white hover:shadow-md hover:border-blue-100 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-bold">AI Automated Fix: CI/CD Failure</div>
                            <div className="text-xs text-slate-500 mt-0.5">{f.repository.repoName} • {new Date(f.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">Open</span>
                          <a href={f.analysisRuns[0].prLink!} target="_blank" className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
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

function StatCard({ title, value, subtitle, trend, positive }: { title: string; value: string | number; subtitle: string; trend?: number; positive?: boolean }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{title}</p>
        {trend && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
        {positive && (
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
        )}
      </div>
      <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
      <p className="text-[10px] text-slate-400 mt-2 font-medium">{subtitle}</p>
    </div>
  );
}

function PipelineStep({ title, status, description, time, confidence, isLast }: { title: string; status: 'success' | 'fail' | 'pending' | 'waiting'; description: string; time?: string; confidence?: number; isLast?: boolean }) {
  return (
    <div className="flex gap-6">
      <div className={`z-10 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-colors ${
        status === 'success' ? 'bg-emerald-500 text-white' : 
        status === 'fail' ? 'bg-rose-500 text-white' : 
        status === 'pending' ? 'bg-blue-500 text-white animate-pulse' : 
        'bg-slate-200 text-slate-400'
      }`}>
        {status === 'success' && (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {(status === 'pending' || status === 'waiting') && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
      </div>
      <div>
        <div className="flex items-center gap-3">
          <h4 className={`text-sm font-bold ${status === 'waiting' ? 'text-slate-400' : 'text-slate-900'}`}>{title}</h4>
          {confidence && (
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-widest">
              Conf: {(confidence * 100).toFixed(0)}%
            </span>
          )}
          {time && <span className="text-[10px] text-slate-400 font-mono">{new Date(time).toLocaleTimeString()}</span>}
        </div>
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      </div>
    </div>
  );
}

function FailureCard({ failure, isSelected, onClick }: { failure: FailureItem; isSelected: boolean; onClick: () => void }) {
  const latestRun = failure.analysisRuns?.[0];
  
  return (
    <button
      onClick={onClick}
      className={`w-full p-5 text-left rounded-2xl border transition-all duration-200 group relative overflow-hidden ${
        isSelected 
          ? 'border-blue-600 bg-white ring-4 ring-blue-50 shadow-lg' 
          : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md'
      }`}
    >
      {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600"></div>}
      <div className="flex justify-between items-start mb-3">
        <span className="font-mono text-[10px] font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg uppercase tracking-wider">
          {failure.commitSha.slice(0, 7)}
        </span>
        <span className="text-[10px] text-slate-400 font-medium">
          {new Date(failure.createdAt).toLocaleTimeString()}
        </span>
      </div>
      <div className="font-bold text-sm text-slate-900 mb-1 truncate">{failure.repository.repoName}</div>
      <div className="text-[10px] text-slate-500 truncate mb-4 italic">
        {latestRun?.rootCause ? latestRun.rootCause.slice(0, 80) + '...' : 'Detection in progress...'}
      </div>
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            latestRun?.reviewStatus === 'approved' ? 'bg-emerald-500' : 
            latestRun?.reviewStatus === 'rejected' ? 'bg-rose-500' : 
            failure.status === 'analyzed' ? 'bg-blue-500' : 'bg-amber-500'
          }`}></div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            {latestRun?.reviewStatus ? latestRun.reviewStatus : failure.status}
          </span>
        </div>
        {latestRun?.prLink && (
           <div className="text-blue-600">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
             </svg>
           </div>
        )}
      </div>
    </button>
  );
}

function LoadingList() {
  return (
    <div className="animate-pulse space-y-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-32 bg-slate-50 rounded-3xl border border-slate-100"></div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mb-4">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <h3 className="text-slate-900 font-bold">No failures yet</h3>
      <p className="text-slate-500 text-xs mt-1">Connect your first GitHub repository to start auto-healing.</p>
    </div>
  );
}
