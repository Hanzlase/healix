'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { SessionManager } from '@/lib/session-manager';
import { getSession, signOut } from 'next-auth/react';
import { 
  Terminal, 
  BarChart2, 
  GitBranch, 
  GitPullRequest, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  Zap, 
  Wrench, 
  Package, 
  Sliders, 
  Check, 
  Cpu, 
  Clock, 
  Activity, 
  Trash2, 
  Copy, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DiffViewer } from '@/components/ui/diff-viewer';
import { SimulateFailureModal } from '@/components/simulate-failure-modal';
import { AppShell } from '@/components/app-shell';

type AnalysisRun = {
  id: string;
  failureId: string;
  rootCause: string;
  category: string;
  confidence: number;
  affectedFile: string | null;
  patch: string | null;
  reviewStatus: string | null;
  reviewReason: string | null;
  reviewRiskLevel: string | null;
  prLink: string | null;
  prBranch: string | null;
  executionTimeMs: number | null;
  pipelineStage: string | null;
  createdAt: string;
};

type FailureItem = {
  id: string;
  repoId: string;
  commitSha: string;
  status: string;
  workflowName: string | null;
  branchName: string | null;
  errorSummary: string | null;
  workflowRunId: string | null;
  logs?: string | null;
  createdAt: string;
  repository: { id: string; repoName: string; repoOwner: string | null; autoPrEnabled: boolean };
  analysisRuns: AnalysisRun[];
};

type Stats = {
  totalRuns: number;
  approvedRuns: number;
  successRate: number;
  avgExecutionTimeMs: number;
  avgConfidence: string;
  prsCreated: number;
};

type Analytics = {
  totalFailures: number;
  rejectionRate: number;
  categoryBreakdown: Record<string, number>;
  riskLevelBreakdown: Record<string, number>;
};

function renderCategoryBadge(catKey: string) {
  const normalized = (catKey || '').toLowerCase();
  let Icon = Cpu;
  let label = catKey || 'General';

  if (normalized === 'runtime') {
    Icon = Zap;
    label = 'Runtime';
  } else if (normalized === 'build') {
    Icon = Wrench;
    label = 'Build';
  } else if (normalized === 'dependency') {
    Icon = Package;
    label = 'Dependency';
  } else if (normalized === 'config' || normalized === 'configuration') {
    Icon = Sliders;
    label = 'Config';
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium bg-[#ECEDE7] text-[#20221F] border border-[#DDDFD7]">
      <Icon className="w-3.5 h-3.5 text-[#D65A31] flex-shrink-0" />
      <span>{label}</span>
    </span>
  );
}

export default function DashboardPage() {
  const [failures, setFailures] = useState<FailureItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [healing, setHealing] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRepoFilter, setSelectedRepoFilter] = useState<string>('all');

  // Interactive UI states
  const [showLogsDrawer, setShowLogsDrawer] = useState(false);
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);
  const [copiedSha, setCopiedSha] = useState(false);
  const [copiedBranch, setCopiedBranch] = useState(false);
  const [copiedLogs, setCopiedLogs] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const nextSession = await getSession();
      const authed = !!nextSession?.user;
      setIsAuthed(authed);
      if (nextSession?.user?.email) setUserEmail(nextSession.user.email);

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
          recentFailures: items.map((f) => f.id),
          failuresCache: items,
          statsCache: sData,
          analyticsCache: aData,
        });
      }

      setFailures(items);
      setStats(sData);
      setAnalytics(aData);
      setSelectedId((prev) => {
        if (prev && items.find((f) => f.id === prev)) return prev;
        return items.length > 0 ? items[0].id : null;
      });
    } catch (e) {
      console.error('Failed to fetch dashboard data:', e);
      const localSess = SessionManager.get();
      if (localSess.failuresCache?.length) {
        setFailures(localSess.failuresCache);
        if (localSess.statsCache) setStats(localSess.statsCache);
        if (localSess.analyticsCache) setAnalytics(localSess.analyticsCache);
        setSelectedId((prev) => prev ?? localSess.failuresCache![0]?.id ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const iv = setInterval(fetchAll, 12000);
    return () => clearInterval(iv);
  }, [fetchAll]);

  const selected = failures.find((f) => f.id === selectedId);
  const latestRun = selected?.analysisRuns?.[0];

  // Distinct repositories list for filtering
  const distinctRepos = useMemo(() => {
    const set = new Set<string>();
    failures.forEach((f) => {
      if (f.repository?.repoName) set.add(f.repository.repoName);
    });
    return Array.from(set);
  }, [failures]);

  // Filtered failures
  const filteredFailures = useMemo(() => {
    return failures.filter((f) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        f.repository.repoName.toLowerCase().includes(q) ||
        (f.branchName && f.branchName.toLowerCase().includes(q)) ||
        f.commitSha.toLowerCase().includes(q) ||
        (f.workflowName && f.workflowName.toLowerCase().includes(q)) ||
        (f.errorSummary && f.errorSummary.toLowerCase().includes(q));

      const run = f.analysisRuns?.[0];
      const actualStatus = run?.reviewStatus ?? f.status;

      let matchesStatus = true;
      if (statusFilter === 'pending') matchesStatus = actualStatus === 'pending';
      else if (statusFilter === 'running') matchesStatus = actualStatus === 'analyzing';
      else if (statusFilter === 'resolved') matchesStatus = actualStatus === 'approved' || actualStatus === 'analyzed';
      else if (statusFilter === 'rejected') matchesStatus = actualStatus === 'rejected' || actualStatus === 'failed';

      const matchesRepo = selectedRepoFilter === 'all' || f.repository.repoName === selectedRepoFilter;

      return matchesSearch && matchesStatus && matchesRepo;
    });
  }, [failures, searchQuery, statusFilter, selectedRepoFilter]);

  const triggerHeal = async () => {
    if (!selected) return;
    setHealing(true);
    try {
      const [owner, repo] = selected.repository.repoName.includes('/')
        ? selected.repository.repoName.split('/')
        : ['healix', selected.repository.repoName];

      await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          failureId: selected.id,
          owner,
          repo,
          workflowRunId: Number(selected.workflowRunId ?? '0') || 1,
          commitSha: selected.commitSha,
        }),
      });
      await fetchAll();
    } catch (err) {
      console.error('Trigger heal error:', err);
    } finally {
      setHealing(false);
    }
  };

  const handleDeleteFailure = async (e: React.MouseEvent, failureId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this incident failure record?')) return;

    try {
      const res = await fetch(`/api/failures/${failureId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');

      setFailures((prev) => {
        const updated = prev.filter((f) => f.id !== failureId);
        if (selectedId === failureId) {
          setSelectedId(updated.length > 0 ? updated[0].id : null);
        }
        return updated;
      });

      const localSess = SessionManager.get();
      if (localSess.failuresCache) {
        SessionManager.update({
          failuresCache: localSess.failuresCache.filter((f: FailureItem) => f.id !== failureId),
          recentFailures: (localSess.recentFailures || []).filter((id: string) => id !== failureId),
        });
      }
    } catch (err) {
      console.error('Failed to delete failure', err);
      alert('Could not delete incident record.');
    }
  };

  const handleCopySha = () => {
    if (!selected) return;
    navigator.clipboard.writeText(selected.commitSha);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 2000);
  };

  const handleCopyBranch = () => {
    if (!selected?.branchName) return;
    navigator.clipboard.writeText(selected.branchName);
    setCopiedBranch(true);
    setTimeout(() => setCopiedBranch(false), 2000);
  };

  const handleCopyLogs = () => {
    if (!selected?.logs && !selected?.errorSummary) return;
    navigator.clipboard.writeText(selected.logs || selected.errorSummary || '');
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  const getStatusBadge = (status: string, reviewStatus?: string | null) => {
    const finalStatus = reviewStatus || status;
    switch (finalStatus) {
      case 'approved':
      case 'analyzed':
        return (
          <Badge variant="success">
            <CheckCircle2 className="w-3 h-3" />
            <span>Resolved</span>
          </Badge>
        );
      case 'failed':
      case 'rejected':
        return (
          <Badge variant="danger">
            <AlertCircle className="w-3 h-3" />
            <span>Failed</span>
          </Badge>
        );
      case 'analyzing':
        return (
          <Badge variant="brand">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Healing...</span>
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge variant="warning">
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </Badge>
        );
    }
  };

  return (
    <AppShell
      userEmail={userEmail}
      isAuthed={isAuthed}
      onRefresh={fetchAll}
      isRefreshing={loading}
      onOpenSimulate={() => setIsSimulateOpen(true)}
      onResetSession={() => {
        if (isAuthed) {
          signOut({ callbackUrl: '/' });
        } else if (confirm('Reset guest session cache?')) {
          SessionManager.reset();
          window.location.reload();
        }
      }}
      activeRepo={selectedRepoFilter !== 'all' ? selectedRepoFilter : undefined}
      totalIncidents={failures.length}
    >
      <div className="space-y-6">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total Incidents"
            value={stats?.totalRuns ?? 0}
            subtext="Workflows intercepted by webhook"
            icon={<BarChart2 className="w-4 h-4 text-[#D65A31]" />}
            badge="All Repos"
          />
          <MetricCard
            label="Auto-Healing Success"
            value={`${stats?.successRate ?? 0}%`}
            subtext="Safety-approved code patches"
            icon={<ShieldCheck className="w-4 h-4 text-[#26764F]" />}
            badge="Verified"
          />
          <MetricCard
            label="Mean Recovery Time"
            value={stats ? `${((stats.avgExecutionTimeMs || 0) / 1000).toFixed(1)}s` : '0.0s'}
            subtext="From failure webhook to fix patch"
            icon={<Zap className="w-4 h-4 text-[#94631A]" />}
            badge="Automated"
          />
          <MetricCard
            label="Pull Requests Opened"
            value={stats?.prsCreated ?? 0}
            subtext="Fix branches staged directly on GitHub"
            icon={<GitPullRequest className="w-4 h-4 text-[#20221F]" />}
            badge="GitHub"
          />
        </div>

        {/* Master-Detail Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Pane: Incident Failure Stream */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
            <div className="bg-[#FFFFFF] border border-[#DDDFD7] rounded-lg shadow-2xs overflow-hidden flex flex-col h-[820px]">
              
              {/* Feed Header */}
              <div className="px-4 py-3 bg-[#F5F4EF] border-b border-[#DDDFD7] flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold font-mono uppercase tracking-wider text-[#20221F] flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#D65A31]" />
                    <span>Incident Stream</span>
                  </h2>
                  <p className="text-[11px] text-[#696D65] font-mono mt-0.5">
                    {filteredFailures.length} of {failures.length} recorded events
                  </p>
                </div>
                
                {distinctRepos.length > 1 && (
                  <select
                    value={selectedRepoFilter}
                    onChange={(e) => setSelectedRepoFilter(e.target.value)}
                    className="text-xs font-mono bg-[#FFFFFF] text-[#20221F] border border-[#DDDFD7] rounded px-2 py-1 focus:outline-none focus:border-[#D65A31]"
                  >
                    <option value="all">All Repositories</option>
                    {distinctRepos.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Search & Filter Bar */}
              <div className="p-3 bg-[#FFFFFF] border-b border-[#DDDFD7] space-y-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#A8ABA2] absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search commits, branches, errors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-7 py-1.5 bg-[#FFFFFF] border border-[#DDDFD7] rounded text-xs font-mono text-[#20221F] placeholder:text-[#A8ABA2] focus:outline-none focus:border-[#D65A31] focus:ring-1 focus:ring-[#D65A31]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-2 text-[#A8ABA2] hover:text-[#20221F] text-xs"
                      aria-label="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Status Filter Tabs */}
                <div className="flex gap-1 overflow-x-auto text-[10px] font-mono font-medium">
                  {[
                    { id: 'all', label: 'All', count: failures.length },
                    { id: 'resolved', label: 'Resolved', count: failures.filter((f) => (f.analysisRuns?.[0]?.reviewStatus === 'approved' || f.status === 'analyzed')).length },
                    { id: 'running', label: 'Running', count: failures.filter((f) => f.status === 'analyzing').length },
                    { id: 'pending', label: 'Pending', count: failures.filter((f) => f.status === 'pending').length },
                    { id: 'rejected', label: 'Failed', count: failures.filter((f) => f.status === 'failed' || f.analysisRuns?.[0]?.reviewStatus === 'rejected').length },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setStatusFilter(tab.id)}
                      className={`px-2 py-1 rounded transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                        statusFilter === tab.id
                          ? 'bg-[#20221F] text-white font-bold'
                          : 'text-[#696D65] hover:bg-[#ECEDE7] hover:text-[#20221F]'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`text-[9px] px-1 py-0.2 rounded ${
                        statusFilter === tab.id ? 'bg-[#353833] text-white' : 'bg-[#ECEDE7] text-[#696D65]'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Feed List Items */}
              <div className="flex-1 overflow-y-auto divide-y divide-[#DDDFD7] bg-[#FFFFFF]">
                {loading && failures.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <RefreshCw className="w-5 h-5 text-[#D65A31] animate-spin mx-auto" />
                    <p className="text-xs text-[#696D65] font-mono">Loading incident stream...</p>
                  </div>
                ) : filteredFailures.length === 0 ? (
                  <div className="p-8 text-center space-y-3">
                    <Database className="w-7 h-7 text-[#A8ABA2] mx-auto" />
                    <div>
                      <p className="text-xs font-semibold text-[#20221F]">No incidents found</p>
                      <p className="text-[11px] text-[#696D65] mt-1 font-mono">
                        {failures.length === 0
                          ? 'Click "Simulate Incident" to inject a test failure.'
                          : 'Try modifying your search or status filters.'}
                      </p>
                    </div>
                    {failures.length === 0 && (
                      <Button
                        size="xs"
                        variant="primary"
                        onClick={() => setIsSimulateOpen(true)}
                        className="mx-auto"
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        Simulate Test Failure
                      </Button>
                    )}
                  </div>
                ) : (
                  filteredFailures.map((f) => {
                    const isSelected = f.id === selectedId;
                    const run = f.analysisRuns?.[0];

                    return (
                      <div
                        key={f.id}
                        onClick={() => setSelectedId(f.id)}
                        className={`p-3.5 transition-subtle cursor-pointer flex flex-col gap-2 relative ${
                          isSelected
                            ? 'bg-[#FBEFEA] border-l-3 border-l-[#D65A31]'
                            : 'hover:bg-[#F5F4EF] border-l-3 border-l-transparent'
                        }`}
                      >
                        {/* Top Row: Repository and Time */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#20221F] truncate font-mono">
                            {f.repository.repoName}
                          </span>
                          <span className="text-[10px] text-[#696D65] font-mono tabular-nums flex-shrink-0">
                            {new Date(f.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Workflow & Commit */}
                        <div className="flex items-center gap-2 text-[11px] text-[#696D65] font-mono">
                          <span className="truncate">{f.workflowName || 'CI Pipeline'}</span>
                          <span>•</span>
                          <span className="font-semibold text-[#4B4F47]">{f.commitSha.slice(0, 7)}</span>
                        </div>

                        {/* Error preview snippet */}
                        {f.errorSummary && (
                          <p className="text-[10px] text-[#B83D38] font-mono truncate bg-[#F8E9E6] px-2 py-1 rounded border border-[#ECC3BE]">
                            {f.errorSummary}
                          </p>
                        )}

                        {/* Bottom Row */}
                        <div className="flex items-center justify-between pt-1">
                          {getStatusBadge(f.status, run?.reviewStatus)}
                          {f.branchName && (
                            <div className="flex items-center gap-1 text-[10px] font-mono text-[#696D65] bg-[#ECEDE7] px-2 py-0.5 rounded border border-[#DDDFD7] max-w-[140px] truncate">
                              <GitBranch className="w-3 h-3 text-[#D65A31] flex-shrink-0" />
                              <span className="truncate">{f.branchName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Pane: Incident Diagnostic & Fix Workspace */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
            
            {/* Incident Diagnostic Container Card */}
            <div className="bg-[#FFFFFF] border border-[#DDDFD7] rounded-lg shadow-2xs overflow-hidden flex flex-col">
              
              {/* Header Bar */}
              <div className="p-5 bg-[#F5F4EF] border-b border-[#DDDFD7] flex flex-row items-start justify-between flex-wrap gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-[#D65A31] uppercase tracking-wider bg-[#FBEFEA] px-2 py-0.5 rounded border border-[#F1CCBE]">
                      INCIDENT DIAGNOSTIC
                    </span>
                    {selected && getStatusBadge(selected.status, latestRun?.reviewStatus)}
                  </div>
                  <h1 className="text-base font-bold tracking-tight text-[#20221F] mt-1">
                    {selected ? selected.repository.repoName : 'Select an incident from the stream'}
                  </h1>
                  {selected && (
                    <div className="flex items-center gap-3 text-xs text-[#696D65] font-mono mt-1 flex-wrap">
                      <div className="flex items-center gap-1">
                        <GitBranch className="w-3.5 h-3.5 text-[#D65A31]" />
                        <span>{selected.branchName || 'main'}</span>
                        <button
                          onClick={handleCopyBranch}
                          className="text-[#696D65] hover:text-[#20221F] ml-0.5 cursor-pointer"
                          title="Copy Branch"
                        >
                          {copiedBranch ? <Check className="w-3 h-3 text-[#26764F]" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <span>SHA: {selected.commitSha.slice(0, 8)}</span>
                        <button
                          onClick={handleCopySha}
                          className="text-[#696D65] hover:text-[#20221F] ml-0.5 cursor-pointer"
                          title="Copy Commit SHA"
                        >
                          {copiedSha ? <Check className="w-3 h-3 text-[#26764F]" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      {selected.workflowRunId && (
                        <>
                          <span>•</span>
                          <span>Run #{selected.workflowRunId}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {selected && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      onClick={(e) => handleDeleteFailure(e, selected.id)}
                      variant="outline"
                      size="sm"
                      className="text-[#696D65] hover:text-[#B83D38] hover:border-[#ECC3BE]"
                      leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                    >
                      Delete
                    </Button>
                    <Button
                      onClick={triggerHeal}
                      isLoading={healing}
                      variant="primary"
                      size="sm"
                    >
                      {healing ? 'Analyzing Pipeline...' : selected.status === 'pending' ? 'Initiate AI Heal' : 'Re-Run AI Heal'}
                    </Button>
                  </div>
                )}
              </div>

              {/* Main Content Area */}
              <div className="p-5 space-y-6">
                {!selected ? (
                  <div className="py-20 text-center space-y-3">
                    <Terminal className="w-10 h-10 text-[#A8ABA2] mx-auto" />
                    <div>
                      <h3 className="text-sm font-semibold text-[#20221F]">No Incident Loaded</h3>
                      <p className="text-xs text-[#696D65] max-w-sm mx-auto mt-1 font-mono">
                        Select an incident from the stream or simulate a new failure to inspect AI diagnostics and code patches.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setIsSimulateOpen(true)}
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      Simulate Test Failure
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Pipeline Stage Visualizer */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold text-[#696D65] uppercase tracking-wider">
                          Autonomous Remediation Stepper
                        </span>
                        {latestRun?.executionTimeMs && (
                          <span className="text-[11px] font-mono text-[#26764F] flex items-center gap-1 font-semibold">
                            <Clock className="w-3 h-3" />
                            <span>{(latestRun.executionTimeMs / 1000).toFixed(2)}s runtime</span>
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {[
                          { label: '1. Ingest Webhook', done: true, current: false, desc: 'Intercepted failure' },
                          { label: '2. Gemini Root Cause', done: !!latestRun, current: selected.status === 'analyzing', desc: 'Analyzed trace logs' },
                          { label: '3. Patch Generation', done: !!latestRun?.patch, current: false, desc: 'Compiled diff' },
                          { label: '4. Safety Review', done: !!latestRun?.reviewStatus, current: false, desc: latestRun?.reviewStatus || 'Pending' },
                          { label: '5. Auto PR Dispatch', done: !!latestRun?.prLink, current: false, desc: latestRun?.prLink ? 'PR staged' : 'Conditional' },
                        ].map((step, idx) => (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-md border flex flex-col gap-1 transition-subtle ${
                              step.done
                                ? 'bg-[#E8F2EA] border-[#C3DEC8] text-[#26764F]'
                                : step.current
                                ? 'bg-[#FBEFEA] border-[#D65A31] ring-1 ring-[#D65A31] text-[#D65A31]'
                                : 'bg-[#F5F4EF] border-[#DDDFD7] text-[#696D65]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">
                                {step.label}
                              </span>
                              {step.done ? (
                                <Check className="w-3.5 h-3.5 text-[#26764F]" />
                              ) : step.current ? (
                                <RefreshCw className="w-3.5 h-3.5 text-[#D65A31] animate-spin" />
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#C4C7BE]" />
                              )}
                            </div>
                            <span className="text-[10px] text-[#696D65] font-mono truncate">
                              {step.desc}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Diagnostics Cards */}
                    {latestRun ? (
                      <div className="space-y-5 pt-2 border-t border-[#DDDFD7]">
                        {/* 3 Overview Info Chips */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Category */}
                          <div className="bg-[#F5F4EF] rounded-md border border-[#DDDFD7] p-3 flex flex-col justify-between gap-1.5">
                            <span className="text-[10px] font-mono font-semibold text-[#696D65] uppercase tracking-wider">
                              Error Classification
                            </span>
                            <div>{renderCategoryBadge(latestRun.category)}</div>
                          </div>

                          {/* Confidence */}
                          <div className="bg-[#F5F4EF] rounded-md border border-[#DDDFD7] p-3 flex flex-col justify-between gap-1.5">
                            <span className="text-[10px] font-mono font-semibold text-[#696D65] uppercase tracking-wider">
                              AI Confidence Score
                            </span>
                            <div>
                              <div className="flex items-center justify-between text-xs font-mono font-bold text-[#20221F] mb-1">
                                <span>{(latestRun.confidence * 100).toFixed(0)}%</span>
                                <span className="text-[10px] text-[#D65A31]">Deterministic</span>
                              </div>
                              <div className="h-1.5 bg-[#DDDFD7] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#D65A31] rounded-full"
                                  style={{ width: `${latestRun.confidence * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Risk Level */}
                          <div className="bg-[#F5F4EF] rounded-md border border-[#DDDFD7] p-3 flex flex-col justify-between gap-1.5">
                            <span className="text-[10px] font-mono font-semibold text-[#696D65] uppercase tracking-wider">
                              Safety Risk Index
                            </span>
                            <div>
                              {latestRun.reviewRiskLevel ? (
                                <Badge
                                  variant={
                                    latestRun.reviewRiskLevel === 'high'
                                      ? 'danger'
                                      : latestRun.reviewRiskLevel === 'medium'
                                      ? 'warning'
                                      : 'success'
                                  }
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span className="capitalize">{latestRun.reviewRiskLevel} Risk</span>
                                </Badge>
                              ) : (
                                <span className="text-[#696D65] text-xs">—</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Root Cause Details */}
                        <div className="bg-[#FFFFFF] border border-[#DDDFD7] rounded-md p-4 space-y-2">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="text-[11px] font-mono font-bold text-[#20221F] uppercase tracking-wider flex items-center gap-1.5">
                              <Cpu className="w-3.5 h-3.5 text-[#D65A31]" />
                              <span>Gemini Diagnosis & Root Cause</span>
                            </span>
                            {latestRun.affectedFile && (
                              <span className="text-[11px] font-mono text-[#D65A31] bg-[#FBEFEA] border border-[#F1CCBE] px-2 py-0.5 rounded font-medium">
                                {latestRun.affectedFile}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#20221F] leading-relaxed font-mono whitespace-pre-wrap">
                            {latestRun.rootCause}
                          </p>
                        </div>

                        {/* Validator Verdict Alert */}
                        {latestRun.reviewReason && (
                          <div className={`p-3.5 rounded-md border flex items-start gap-2.5 ${
                            latestRun.reviewStatus === 'approved'
                              ? 'bg-[#E8F2EA] border-[#C3DEC8] text-[#26764F]'
                              : 'bg-[#F8E9E6] border-[#ECC3BE] text-[#B83D38]'
                          }`}>
                            {latestRun.reviewStatus === 'approved' ? (
                              <CheckCircle2 className="w-4 h-4 text-[#26764F] flex-shrink-0 mt-0.5" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-[#B83D38] flex-shrink-0 mt-0.5" />
                            )}
                            <div className="space-y-0.5">
                              <span className="text-[11px] font-bold uppercase tracking-wider font-mono block">
                                Safety Review Verdict: {latestRun.reviewStatus?.toUpperCase()}
                              </span>
                              <p className="text-xs font-mono leading-relaxed">
                                {latestRun.reviewReason}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Generated Patch Diff Viewer */}
                        {latestRun.patch && (
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-mono font-bold text-[#696D65] uppercase tracking-wider block">
                              Synthesized Autonomous Code Fix
                            </span>
                            <DiffViewer patch={latestRun.patch} filename={latestRun.affectedFile} />
                          </div>
                        )}

                        {/* PR Banner */}
                        {latestRun.prLink && (
                          <div className="p-4 bg-[#FFFFFF] border border-[#DDDFD7] rounded-md flex items-center justify-between flex-wrap gap-4 shadow-2xs">
                            <div className="space-y-0.5">
                              <h4 className="text-xs font-bold text-[#20221F] flex items-center gap-2">
                                <GitPullRequest className="w-4 h-4 text-[#D65A31]" />
                                <span>Pull Request Staged on GitHub</span>
                              </h4>
                              <p className="text-[11px] text-[#696D65] font-mono">
                                Branch: <span className="text-[#20221F] font-semibold">{latestRun.prBranch || 'healix/fix'}</span>
                              </p>
                            </div>
                            <a
                              href={latestRun.prLink}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3.5 py-2 bg-[#20221F] hover:bg-[#353833] text-white rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 shadow-2xs"
                            >
                              <span>View PR on GitHub</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* When no analysis run exists yet */
                      <div className="bg-[#F5F4EF] border border-[#DDDFD7] rounded-md p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#94631A]" />
                          <span className="text-xs font-bold text-[#20221F]">Failure Captured — Diagnosis Pending</span>
                        </div>
                        <p className="text-xs text-[#696D65] font-mono leading-relaxed">
                          This incident was captured from the CI/CD pipeline. Click &quot;Initiate AI Heal&quot; above to analyze the error logs and generate a validated code repair.
                        </p>
                      </div>
                    )}

                    {/* Expandable Raw Terminal Logs Drawer */}
                    {(selected.logs || selected.errorSummary) && (
                      <div className="border border-[#353934] rounded-md bg-[#191B19] overflow-hidden">
                        <div className="px-3.5 py-2 bg-[#222522] flex items-center justify-between text-xs font-mono text-[#E8E9E3]">
                          <button
                            onClick={() => setShowLogsDrawer(!showLogsDrawer)}
                            className="flex items-center gap-2 font-medium hover:text-white transition-colors cursor-pointer"
                          >
                            <Terminal className="w-3.5 h-3.5 text-[#A0A49B]" />
                            <span>Raw CI/CD Pipeline Trace Logs</span>
                            {showLogsDrawer ? <ChevronUp className="w-3.5 h-3.5 text-[#A0A49B]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#A0A49B]" />}
                          </button>
                          <button
                            onClick={handleCopyLogs}
                            className="px-2 py-0.5 rounded bg-[#191B19] hover:bg-[#2D312D] text-[11px] text-[#A0A49B] hover:text-[#E8E9E3] border border-[#353934] flex items-center gap-1 transition-colors cursor-pointer"
                            title="Copy Raw Trace Logs"
                          >
                            {copiedLogs ? <Check className="w-3 h-3 text-[#83C995]" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedLogs ? 'Copied' : 'Copy Logs'}</span>
                          </button>
                        </div>
                        {showLogsDrawer && (
                          <div className="p-4 bg-[#191B19] border-t border-[#353934] max-h-80 overflow-y-auto terminal-scroll">
                            <pre className="font-mono text-[11px] text-[#E58C85] whitespace-pre-wrap leading-relaxed select-text">
                              {selected.logs || selected.errorSummary}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Panel: Incident Distribution Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category Breakdown */}
              <div className="bg-[#FFFFFF] border border-[#DDDFD7] rounded-lg p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#DDDFD7] pb-2">
                  <h3 className="text-xs font-bold text-[#20221F] uppercase tracking-wider font-mono">
                    Failure Categories Distribution
                  </h3>
                  <span className="text-[10px] text-[#696D65] font-mono">Classification</span>
                </div>
                {analytics && Object.keys(analytics.categoryBreakdown).length > 0 ? (
                  <div className="space-y-2.5">
                    {Object.entries(analytics.categoryBreakdown).map(([cat, count]) => {
                      const total = Object.values(analytics.categoryBreakdown).reduce((a, b) => a + b, 0);
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                      return (
                        <div key={cat} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold">{renderCategoryBadge(cat)}</span>
                            <span className="font-mono text-[#696D65] font-bold tabular-nums">{count} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 bg-[#ECEDE7] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#D65A31] rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-[#696D65] font-mono">
                    No category telemetry available yet.
                  </div>
                )}
              </div>

              {/* Risk Distribution */}
              <div className="bg-[#FFFFFF] border border-[#DDDFD7] rounded-lg p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#DDDFD7] pb-2">
                  <h3 className="text-xs font-bold text-[#20221F] uppercase tracking-wider font-mono">
                    Safety & Risk Distribution
                  </h3>
                  <span className="text-[10px] text-[#696D65] font-mono">Guardrails</span>
                </div>
                {analytics && Object.keys(analytics.riskLevelBreakdown).length > 0 ? (
                  <div className="space-y-2.5">
                    {Object.entries(analytics.riskLevelBreakdown).map(([risk, count]) => {
                      const total = Object.values(analytics.riskLevelBreakdown).reduce((a, b) => a + b, 0);
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                      const barColor =
                        risk === 'high' ? 'bg-[#B83D38]' : risk === 'medium' ? 'bg-[#94631A]' : 'bg-[#26764F]';
                      return (
                        <div key={risk} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-mono font-bold capitalize text-[#20221F]">
                              {risk} Risk
                            </span>
                            <span className="font-mono text-[#696D65] font-bold tabular-nums">{count} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 bg-[#ECEDE7] rounded-full overflow-hidden">
                            <div
                              className={`h-full ${barColor} rounded-full`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-4 text-center text-xs text-[#696D65] font-mono">
                    No risk evaluation records available yet.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Simulation Modal */}
      <SimulateFailureModal
        isOpen={isSimulateOpen}
        onClose={() => setIsSimulateOpen(false)}
        onSimulated={(newFailureId) => {
          fetchAll();
          setSelectedId(newFailureId);
        }}
        defaultRepo={selected?.repository.repoName || 'Hanzlase/healixtesting'}
      />
    </AppShell>
  );
}

function MetricCard({
  label,
  value,
  subtext,
  icon,
  badge,
}: {
  label: string;
  value: string | number;
  subtext: string;
  icon: React.ReactNode;
  badge?: string;
}) {
  return (
    <div className="p-4 rounded-lg border border-[#DDDFD7] bg-[#FFFFFF] shadow-2xs flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#696D65]">
          {label}
        </span>
        <div className="w-7 h-7 rounded-md bg-[#F5F4EF] border border-[#DDDFD7] flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
      </div>
      <div className="mt-3">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tracking-tight text-[#20221F] leading-none tabular-nums">
            {value}
          </span>
          {badge && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#ECEDE7] text-[#696D65] border border-[#DDDFD7]">
              {badge}
            </span>
          )}
        </div>
        <p className="text-[11px] text-[#696D65] mt-1 leading-snug">
          {subtext}
        </p>
      </div>
    </div>
  );
}
