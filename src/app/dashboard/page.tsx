'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { SessionManager } from '@/lib/session-manager';
import { getSession, signOut } from 'next-auth/react';
import { 
  Terminal, 
  Settings, 
  RefreshCw, 
  BarChart2, 
  ShieldAlert, 
  GitBranch, 
  GitPullRequest, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  ArrowUpRight, 
  LogOut,
  SlidersHorizontal,
  ChevronRight,
  Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DiffViewer } from '@/components/ui/diff-viewer';

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
  workflowRunId: string | null;
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

const CATEGORY_LABEL: Record<string, string> = {
  runtime: '⚡ Runtime', 
  build: '🔨 Build', 
  dependency: '📦 Dependency', 
  config: '⚙️ Configuration',
};

export default function DashboardPage() {
  const [failures, setFailures] = useState<FailureItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [healing, setHealing] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  
  // Search & filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchAll = useCallback(async () => {
    try {
      const nextSession = await getSession();
      const authed = !!nextSession?.user;
      setIsAuthed(authed);
      
      const localSess = SessionManager.get();
      const urlSuffix = authed ? '' : `?repos=${encodeURIComponent(localSess.repoFullName || '')}`;

      const [fRes, sRes, aRes] = await Promise.all([
        fetch(`/api/failures${urlSuffix}`),
        fetch(`/api/stats${urlSuffix}`),
        fetch(`/api/analytics${urlSuffix}`),
      ]);
      const fData = await fRes.json();
      const sData = await sRes.json();
      const aData = await aRes.json();

      const items: FailureItem[] = fData.failures ?? [];

      if (!authed) {
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
  }, []);

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
          workflowRunId: Number(selected.workflowRunId ?? '0'),
          commitSha: selected.commitSha,
        }),
      });
      await fetchAll();
    } finally {
      setHealing(false);
    }
  };

  // Filter failures list based on query and status filter
  const filteredFailures = useMemo(() => {
    return failures.filter(f => {
      const matchesSearch = 
        f.repository.repoName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.branchName && f.branchName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        f.commitSha.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.workflowName && f.workflowName.toLowerCase().includes(searchQuery.toLowerCase()));

      const run = f.analysisRuns?.[0];
      const actualStatus = run?.reviewStatus ?? f.status;
      const matchesStatus = statusFilter === 'all' || actualStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [failures, searchQuery, statusFilter]);

  const getStatusBadge = (status: string, reviewStatus?: string | null) => {
    const finalStatus = reviewStatus || status;
    switch (finalStatus) {
      case 'approved':
      case 'analyzed':
        return <Badge variant="success">Resolved</Badge>;
      case 'failed':
      case 'rejected':
        return <Badge variant="error">Failed</Badge>;
      case 'analyzing':
        return (
          <Badge variant="info" className="flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Analyzing
          </Badge>
        );
      case 'pending':
      default:
        return <Badge variant="warning">Pending</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-surface-900 font-sans flex flex-col">
      {/* Navigation Header */}
      <nav className="bg-white border-b border-surface-200/80 sticky top-0 z-40 px-6 py-3.5">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-surface-900">Healix</span>
            </Link>
            
            <div className="flex items-center gap-5 text-xs font-bold uppercase tracking-wider">
              <span className="text-brand-600 border-b-2 border-brand-600 pb-1 px-0.5">Overview</span>
              <Link href="/dashboard/settings" className="text-surface-500 hover:text-surface-900 transition-colors py-1">Settings</Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live indicator dot */}
            <div className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-md border border-emerald-200/60 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 select-none">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Live Feed
            </div>
            
            {/* Session info */}
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-block text-xs font-semibold text-surface-450 border-r border-surface-200 pr-3">
                {isAuthed ? 'Authorized' : 'Guest Space'}
              </span>
              <Link
                href="/dashboard/settings"
                className="w-8 h-8 rounded-lg bg-surface-50 border border-surface-200 flex items-center justify-center hover:bg-surface-100 transition-smooth text-surface-500 hover:text-surface-800"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </Link>
              {isAuthed ? (
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="w-8 h-8 rounded-lg bg-surface-50 border border-surface-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-smooth text-surface-500 hover:text-red-600 cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (confirm('Clear local guest session data?')) {
                      SessionManager.reset();
                      window.location.href = '/';
                    }
                  }}
                  className="w-8 h-8 rounded-lg bg-surface-50 border border-surface-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-smooth text-surface-500 hover:text-red-600 cursor-pointer"
                  title="Reset Guest Cache"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Workspace */}
      <div className="max-w-[1600px] w-full mx-auto px-6 py-6 flex-1 flex flex-col gap-6">
        
        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard 
            label="Total Analyzed" 
            value={stats?.totalRuns ?? 0} 
            description="Pipeline runs processed" 
            icon={<BarChart2 className="w-5 h-5 text-brand-600" />}
            loading={loading && !stats}
          />
          <MetricCard 
            label="Success Rate" 
            value={`${stats?.successRate ?? 0}%`} 
            description="AI repairs approved" 
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            loading={loading && !stats}
          />
          <MetricCard 
            label="Avg MTTR" 
            value={stats ? `${((stats.avgExecutionTimeMs || 0)/1000).toFixed(1)}s` : '0.0s'} 
            description="Mean recovery time" 
            icon={<RefreshCw className="w-5 h-5 text-amber-600" />}
            loading={loading && !stats}
          />
          <MetricCard 
            label="Auto PRs Created" 
            value={stats?.prsCreated ?? 0} 
            description="Pull requests proposed" 
            icon={<GitPullRequest className="w-5 h-5 text-indigo-600" />}
            loading={loading && !stats}
          />
        </div>

        {/* Master-Detail Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1">
          
          {/* Left Pane: Failure Feed List */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <Card className="h-[780px] flex flex-col border border-surface-200/80">
              {/* Feed Header */}
              <div className="px-5 py-4 border-b border-surface-150 bg-surface-50 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-surface-900 tracking-tight">Failure Feed</h2>
                  <p className="text-[10px] text-surface-450 font-semibold tracking-wider uppercase mt-0.5">
                    {filteredFailures.length} incident{filteredFailures.length === 1 ? '' : 's'}
                  </p>
                </div>
                
                {/* Refresh loading indicator */}
                {loading && (
                  <RefreshCw className="w-3.5 h-3.5 text-brand-500 animate-spin" />
                )}
              </div>

              {/* Feed Filters */}
              <div className="p-4 border-b border-surface-100 bg-white flex flex-col gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-surface-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search repo, branch or commit..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-surface-200 rounded-lg text-xs transition-smooth placeholder:text-surface-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                  />
                </div>
                
                {/* Status Tabs */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 text-[10px] font-bold uppercase tracking-wider border-b border-surface-100">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'pending', label: 'Pending' },
                    { id: 'analyzing', label: 'Running' },
                    { id: 'approved', label: 'Resolved' },
                    { id: 'rejected', label: 'Rejected' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setStatusFilter(tab.id)}
                      className={`px-2.5 py-1 rounded transition-smooth whitespace-nowrap cursor-pointer ${
                        statusFilter === tab.id 
                          ? 'bg-surface-900 text-white' 
                          : 'text-surface-500 hover:bg-surface-100 hover:text-surface-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FBFDFE]">
                {loading && failures.length === 0 ? (
                  /* Feed Loader Skeleton */
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="p-4 border border-surface-200 rounded-xl bg-white space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="h-4 bg-surface-100 rounded w-16 animate-shimmer" />
                          <div className="h-3 bg-surface-100 rounded w-12 animate-shimmer" />
                        </div>
                        <div className="h-5 bg-surface-100 rounded w-3/4 animate-shimmer" />
                        <div className="h-3 bg-surface-100 rounded w-1/2 animate-shimmer" />
                      </div>
                    ))}
                  </div>
                ) : filteredFailures.length === 0 ? (
                  /* Empty state inside feed */
                  <div className="py-16 text-center space-y-3 select-none">
                    <Database className="w-8 h-8 text-surface-300 mx-auto" />
                    <div>
                      <p className="text-xs font-bold text-surface-700">No matching events found</p>
                      {failures.length === 0 ? (
                        <p className="text-[11px] text-surface-400 mt-1">Connect a repository in settings to capture failure hooks.</p>
                      ) : (
                        <p className="text-[11px] text-surface-400 mt-1">Try clearing your filters or query search.</p>
                      )}
                    </div>
                    {failures.length === 0 && (
                      <Link href="/dashboard/settings" className="inline-block mt-3">
                        <Button variant="outline" size="sm">Configure Settings</Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  filteredFailures.map(f => {
                    const run = f.analysisRuns?.[0];
                    const isSelected = selectedId === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setSelectedId(f.id)}
                        className={`w-full p-4 text-left rounded-xl border transition-smooth flex flex-col gap-2.5 cursor-pointer ${
                          isSelected 
                            ? 'bg-white border-brand-500 shadow-md ring-1 ring-brand-500/10' 
                            : 'bg-white border-surface-200/80 hover:border-surface-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-mono text-[10px] font-bold text-surface-400 uppercase bg-surface-50 px-2 py-0.5 rounded border border-surface-200/30">
                            {f.commitSha.slice(0, 7)}
                          </span>
                          <span className="text-[10px] text-surface-450 font-medium">
                            {new Date(f.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div>
                          <p className="font-bold text-xs text-surface-900 truncate">
                            {f.repository.repoName}
                          </p>
                          {f.workflowName && (
                            <p className="text-[10px] text-surface-450 font-medium truncate mt-0.5 flex items-center gap-1">
                              <Terminal className="w-3 h-3 text-surface-400 flex-shrink-0" />
                              {f.workflowName}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between border-t border-surface-100 pt-2.5 w-full">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(f.status, run?.reviewStatus)}
                          </div>
                          
                          {f.branchName && (
                            <div className="flex items-center gap-1 text-[10px] font-mono text-surface-500 truncate max-w-[150px]">
                              <GitBranch className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{f.branchName}</span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </Card>
          </div>

          {/* Right Pane: Incident Trace Details */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Header / Pipeline Overview Card */}
            <Card className="border border-surface-200/80">
              <CardHeader className="flex flex-row items-start justify-between flex-wrap gap-4 border-b border-surface-100">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">Incident Diagnostic</span>
                  <h1 className="text-xl font-extrabold tracking-tight text-surface-900">
                    {selected ? selected.repository.repoName : 'Select a failure'}
                  </h1>
                  {selected?.branchName && (
                    <div className="flex items-center gap-1.5 text-xs text-surface-500 font-mono mt-1">
                      <GitBranch className="w-3.5 h-3.5" />
                      <span>{selected.branchName}</span>
                      <span className="text-surface-300">•</span>
                      <span>SHA: {selected.commitSha.slice(0, 8)}</span>
                    </div>
                  )}
                </div>

                {selected && (
                  <div className="flex items-center gap-3">
                    {selected.status !== 'analyzing' && (
                      <Button
                        onClick={triggerHeal}
                        isLoading={healing}
                        size="sm"
                        variant={selected.status === 'pending' ? 'primary' : 'outline'}
                      >
                        {healing ? 'Analyzing...' : selected.status === 'pending' ? 'Initiate Fix' : 'Retry Heal'}
                      </Button>
                    )}
                    {latestRun ? (
                      getStatusBadge(selected.status, latestRun.reviewStatus)
                    ) : (
                      <Badge variant="warning">Pending</Badge>
                    )}
                  </div>
                )}
              </CardHeader>

              <CardContent className="p-6">
                {!selected ? (
                  /* Select state empty illustration */
                  <div className="py-20 text-center space-y-3">
                    <Terminal className="w-10 h-10 text-surface-300 mx-auto" />
                    <div>
                      <h3 className="text-sm font-bold text-surface-700">No Incident Loaded</h3>
                      <p className="text-xs text-surface-450 max-w-xs mx-auto mt-1">Select an item from the feed on the left to read failure traces and review proposed fixes.</p>
                    </div>
                  </div>
                ) : (
                  /* Active Trace Details */
                  <div className="space-y-6">
                    {/* Pipeline Stage Indicators */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-surface-700 uppercase tracking-wider">Pipeline Flow status</h3>
                      <div className="grid grid-cols-5 gap-2 text-center">
                        {[
                          { label: 'Detect', active: true, done: true },
                          { label: 'Analyze', active: !!latestRun, done: !!latestRun },
                          { label: 'Patch', active: !!latestRun?.patch, done: !!latestRun?.patch },
                          { label: 'Review', active: !!latestRun?.reviewStatus, done: !!latestRun?.reviewStatus },
                          { label: 'PR Opened', active: !!latestRun?.prLink, done: !!latestRun?.prLink },
                        ].map((step, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg border transition-smooth flex flex-col items-center gap-1.5 ${
                              step.active 
                                ? 'bg-surface-50 border-surface-200' 
                                : 'bg-surface-50/50 border-surface-200/40 opacity-40'
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              step.done 
                                ? 'bg-brand-500 text-white shadow-sm' 
                                : 'bg-surface-200 text-surface-400'
                            }`}>
                              {step.done ? '✓' : '•'}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-surface-600">
                              {step.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Diagnostics details */}
                    {latestRun ? (
                      <div className="space-y-6 pt-4 border-t border-surface-150">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {/* Info chips */}
                          <div className="bg-surface-50 rounded-lg border border-surface-200 p-3">
                            <span className="text-[9px] font-bold text-surface-450 uppercase tracking-widest block">Root Cause Type</span>
                            <span className="text-xs font-bold text-surface-800 mt-1 block">
                              {CATEGORY_LABEL[latestRun.category] || latestRun.category}
                            </span>
                          </div>

                          <div className="bg-surface-50 rounded-lg border border-surface-200 p-3">
                            <span className="text-[9px] font-bold text-surface-450 uppercase tracking-widest block">Confidence Score</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-bold text-surface-800">
                                {(latestRun.confidence * 100).toFixed(0)}%
                              </span>
                              <div className="flex-1 h-1.5 bg-surface-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-brand-500 rounded-full" 
                                  style={{ width: `${latestRun.confidence * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="bg-surface-50 rounded-lg border border-surface-200 p-3">
                            <span className="text-[9px] font-bold text-surface-450 uppercase tracking-widest block">Risk Assessment</span>
                            <span className="text-xs font-bold text-surface-800 mt-1 block">
                              {latestRun.reviewRiskLevel ? (
                                <span className={`capitalize ${
                                  latestRun.reviewRiskLevel === 'high' ? 'text-red-600' :
                                  latestRun.reviewRiskLevel === 'medium' ? 'text-amber-600' : 'text-emerald-600'
                                }`}>
                                  {latestRun.reviewRiskLevel} Risk
                                </span>
                              ) : (
                                '—'
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Root Cause Details */}
                        <div className="bg-surface-50 border border-surface-200 rounded-lg p-5">
                          <span className="text-[10px] font-bold text-surface-450 uppercase tracking-wider block mb-2">Diagnostic Root Cause</span>
                          <p className="text-xs text-surface-850 leading-relaxed font-semibold">
                            {latestRun.rootCause}
                          </p>
                        </div>

                        {/* Verdict / Review details */}
                        {latestRun.reviewReason && (
                          <div className={`p-4 rounded-lg border ${
                            latestRun.reviewStatus === 'approved' 
                              ? 'bg-emerald-50/60 border-emerald-200/60 text-emerald-800' 
                              : 'bg-red-50/60 border-red-200/60 text-red-800'
                          }`}>
                            <div className="flex items-center gap-2 mb-1.5">
                              {latestRun.reviewStatus === 'approved' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-600" />
                              )}
                              <span className="text-[10px] font-bold uppercase tracking-wider">
                                Validator Verdict ({latestRun.reviewStatus})
                              </span>
                            </div>
                            <p className="text-xs font-semibold leading-relaxed">
                              {latestRun.reviewReason}
                            </p>
                          </div>
                        )}

                        {/* Custom Patch Diff Viewer */}
                        {latestRun.patch && (
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-surface-450 uppercase tracking-wider block">Generated Fix Patch</span>
                            <DiffViewer patch={latestRun.patch} filename={latestRun.affectedFile} />
                          </div>
                        )}

                        {/* PR integration Alert */}
                        {latestRun.prLink && (
                          <div className="p-4 bg-brand-50 border border-brand-200/60 rounded-lg flex items-center justify-between flex-wrap gap-4">
                            <div className="space-y-1">
                              <h4 className="text-xs font-bold text-brand-850 flex items-center gap-1.5">
                                <GitPullRequest className="w-4 h-4 text-brand-600" />
                                Autonomous Pull Request Opened
                              </h4>
                              <p className="text-[11px] text-brand-700/80 font-mono">
                                Target Branch: {latestRun.prBranch ?? 'healix/fix'}
                              </p>
                            </div>
                            <a
                              href={latestRun.prLink}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3.5 py-1.5 bg-brand-600 text-white rounded-md text-xs font-bold hover:bg-brand-700 transition-smooth flex items-center gap-1"
                            >
                              <span>View PR on GitHub</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Logs or status details if no analysis run exists yet */
                      <div className="bg-surface-50 border border-surface-200 rounded-lg p-5 space-y-4">
                        <div className="flex items-center gap-2 border-b border-surface-200 pb-3">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                          <span className="text-xs font-bold text-surface-700">Diagnostic Pending</span>
                        </div>
                        <div className="space-y-3 font-mono text-[11px] text-surface-600">
                          {selected.errorSummary ? (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold text-surface-450 uppercase tracking-wider block">Captured Error Summary</span>
                              <pre className="bg-white border border-surface-200 rounded p-3 text-red-650 overflow-x-auto max-h-40 leading-relaxed whitespace-pre-wrap">
                                {selected.errorSummary}
                              </pre>
                            </div>
                          ) : (
                            <p className="italic">No diagnostics generated yet. Click "Initiate Fix" above to analyze this failure run.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bottom Panel: Incident charts and aggregates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Category Breakdown Chart */}
              <Card className="border border-surface-200/80">
                <CardHeader className="py-4 border-b border-surface-100">
                  <CardTitle className="text-xs uppercase tracking-wider text-surface-500 font-bold">Category Distribution</CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  {analytics && Object.keys(analytics.categoryBreakdown).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(analytics.categoryBreakdown).map(([cat, count]) => {
                        const total = Object.values(analytics.categoryBreakdown).reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? (count / total) * 100 : 0;
                        return (
                          <div key={cat} className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-surface-750">
                                {CATEGORY_LABEL[cat] || cat}
                              </span>
                              <span className="font-bold text-surface-900">{count}</span>
                            </div>
                            <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-brand-500 rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-surface-400 italic">No breakdown data available.</div>
                  )}
                </CardContent>
              </Card>

              {/* Risk Distribution Chart */}
              <Card className="border border-surface-200/80">
                <CardHeader className="py-4 border-b border-surface-100">
                  <CardTitle className="text-xs uppercase tracking-wider text-surface-500 font-bold">Risk Assessment Index</CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  {analytics && Object.keys(analytics.riskLevelBreakdown).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(analytics.riskLevelBreakdown).map(([risk, count]) => {
                        const total = Object.values(analytics.riskLevelBreakdown).reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? (count / total) * 100 : 0;
                        
                        const colorMap: Record<string, string> = {
                          low: 'bg-emerald-500',
                          medium: 'bg-amber-500',
                          high: 'bg-red-500',
                        };
                        const textColors: Record<string, string> = {
                          low: 'text-emerald-700',
                          medium: 'text-amber-700',
                          high: 'text-red-700',
                        };

                        return (
                          <div key={risk} className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className={`font-bold capitalize ${textColors[risk] || 'text-surface-700'}`}>
                                {risk}
                              </span>
                              <span className="font-bold text-surface-900">{count}</span>
                            </div>
                            <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${colorMap[risk] || 'bg-brand-500'} rounded-full transition-all duration-500`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-surface-400 italic">No risk distribution data available.</div>
                  )}
                </CardContent>
              </Card>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* Sub-components for Layout Organization */
interface MetricCardProps {
  label: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  loading?: boolean;
}

function MetricCard({ label, value, description, icon, loading = false }: MetricCardProps) {
  return (
    <Card className="border border-surface-200/80 transition-smooth hover:border-surface-300 hover:shadow-sm">
      <CardContent className="p-5 flex items-start justify-between">
        <div className="space-y-1 flex-1">
          <span className="text-[10px] font-bold text-surface-450 uppercase tracking-wider block">
            {label}
          </span>
          {loading ? (
            <div className="h-9 bg-surface-100 rounded w-20 animate-shimmer" />
          ) : (
            <p className="text-2xl font-extrabold tracking-tight text-surface-900 leading-none">
              {value}
            </p>
          )}
          <span className="text-[10px] text-surface-400 font-semibold block pt-1">
            {description}
          </span>
        </div>
        <div className="w-10 h-10 rounded-lg bg-surface-50 border border-surface-200/60 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
