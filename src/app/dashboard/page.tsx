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
  ArrowUpRight, 
  LogOut,
  ChevronRight,
  Database,
  Zap,
  Wrench,
  Package,
  Sliders,
  Check,
  Cpu,
  Sparkles,
  Clock,
  Activity,
  FileCode,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  Filter,
  ExternalLink,
  ShieldCheck,
  Flame,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DiffViewer } from '@/components/ui/diff-viewer';
import { SimulateFailureModal } from '@/components/simulate-failure-modal';

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

function renderCategoryTag(catKey: string) {
  const normalized = (catKey || '').toLowerCase();
  let Icon = Cpu;
  let label = catKey || 'Unknown';
  let badgeColor = 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';

  if (normalized === 'runtime') {
    Icon = Zap;
    label = 'Runtime';
    badgeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  } else if (normalized === 'build') {
    Icon = Wrench;
    label = 'Build';
    badgeColor = 'text-blue-400 bg-blue-500/10 border-blue-500/20';
  } else if (normalized === 'dependency') {
    Icon = Package;
    label = 'Dependency';
    badgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  } else if (normalized === 'config' || normalized === 'configuration') {
    Icon = Sliders;
    label = 'Configuration';
    badgeColor = 'text-purple-400 bg-purple-500/10 border-purple-500/20';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold ${badgeColor}`}>
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
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
          failuresCache: localSess.failuresCache.filter((f: any) => f.id !== failureId),
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

  const getStatusBadge = (status: string, reviewStatus?: string | null) => {
    const finalStatus = reviewStatus || status;
    switch (finalStatus) {
      case 'approved':
      case 'analyzed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Resolved</span>
          </span>
        );
      case 'failed':
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/15 text-red-400 border border-red-500/25">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Failed</span>
          </span>
        );
      case 'analyzing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Healing...</span>
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending</span>
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 font-sans flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Mission Control Bar */}
      <nav className="bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-40 px-6 py-3 transition-colors">
        <div className="max-w-[1680px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                <RefreshCw className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-extrabold tracking-tight text-white leading-tight flex items-center gap-1.5">
                  Healix <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-400 font-mono border border-indigo-500/30">v2.0</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider">AUTONOMOUS ENGINE</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-1 text-xs font-semibold">
              <Link href="/dashboard" className="px-3 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 font-bold border border-indigo-500/20">
                Live Console
              </Link>
              <Link href="/dashboard/settings" className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors">
                Settings & Webhooks
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Engine Pulse */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
              <span>LISTENER ACTIVE</span>
            </div>

            {/* Test Simulation Button */}
            <Button
              onClick={() => setIsSimulateOpen(true)}
              size="sm"
              className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 border border-indigo-400/30"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span>Simulate Incident</span>
            </Button>

            {/* Refresh feed */}
            <button
              onClick={fetchAll}
              disabled={loading}
              className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Refresh Incidents"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>

            {/* Settings Link */}
            <Link
              href="/dashboard/settings"
              className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </Link>

            {/* Session Indicator */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <span className="hidden lg:inline-block text-[11px] font-mono text-slate-400 max-w-[120px] truncate">
                {isAuthed ? userEmail || 'Authenticated' : 'Guest Demo'}
              </span>
              {isAuthed ? (
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (confirm('Clear local guest session cache?')) {
                      SessionManager.reset();
                      window.location.reload();
                    }
                  }}
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
                  title="Reset Demo Session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Workspace */}
      <div className="max-w-[1680px] w-full mx-auto px-6 py-6 flex-1 flex flex-col gap-6">
        
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total Incidents Analyzed"
            value={stats?.totalRuns ?? 0}
            subtext="Automated failure workflows intercepted"
            icon={<BarChart2 className="w-5 h-5 text-indigo-400" />}
            accent="border-indigo-500/20 bg-indigo-950/10"
            badgeText="All Repos"
          />
          <MetricCard
            label="Auto-Healing Success Rate"
            value={`${stats?.successRate ?? 0}%`}
            subtext="Patches verified and approved by AI safety validator"
            icon={<ShieldCheck className="w-5 h-5 text-emerald-400" />}
            accent="border-emerald-500/20 bg-emerald-950/10"
            badgeText="Verified"
          />
          <MetricCard
            label="Mean Time To Recovery"
            value={stats ? `${((stats.avgExecutionTimeMs || 0) / 1000).toFixed(1)}s` : '0.0s'}
            subtext="From webhook failure to ready patch"
            icon={<Zap className="w-5 h-5 text-amber-400" />}
            accent="border-amber-500/20 bg-amber-950/10"
            badgeText="Sub-Second"
          />
          <MetricCard
            label="Auto-PRs Dispatched"
            value={stats?.prsCreated ?? 0}
            subtext="Fix pull requests opened directly on GitHub"
            icon={<GitPullRequest className="w-5 h-5 text-cyan-400" />}
            accent="border-cyan-500/20 bg-cyan-950/10"
            badgeText="GitHub"
          />
        </div>

        {/* Master-Detail Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1">
          
          {/* Left Pane: Incident Failure Feed */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[820px]">
              
              {/* Feed Header */}
              <div className="px-5 py-3.5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    <span>Incident Stream</span>
                  </h2>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {filteredFailures.length} of {failures.length} recorded failure events
                  </p>
                </div>
                
                {distinctRepos.length > 1 && (
                  <select
                    value={selectedRepoFilter}
                    onChange={(e) => setSelectedRepoFilter(e.target.value)}
                    className="text-[11px] font-mono bg-slate-900 text-slate-300 border border-slate-700/80 rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500"
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
              <div className="p-3.5 bg-slate-950/40 border-b border-slate-800 space-y-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search commits, branches, errors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-300 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Status Filter Tabs */}
                <div className="flex gap-1 overflow-x-auto text-[10px] font-bold uppercase tracking-wider">
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
                      className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                        statusFilter === tab.id
                          ? 'bg-indigo-600 text-white shadow-xs font-bold'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${
                        statusFilter === tab.id ? 'bg-indigo-800 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Feed List Items */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-slate-950/20">
                {loading && failures.length === 0 ? (
                  <div className="p-8 text-center space-y-3">
                    <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
                    <p className="text-xs text-slate-400 font-mono">Loading incident stream...</p>
                  </div>
                ) : filteredFailures.length === 0 ? (
                  <div className="p-10 text-center space-y-4">
                    <Database className="w-8 h-8 text-slate-600 mx-auto" />
                    <div>
                      <p className="text-xs font-bold text-slate-300">No incident events found</p>
                      <p className="text-[11px] text-slate-500 mt-1 font-mono">
                        {failures.length === 0
                          ? 'Click "Simulate Incident" above or configure a GitHub webhook in settings.'
                          : 'Try modifying your search or status filters.'}
                      </p>
                    </div>
                    {failures.length === 0 && (
                      <Button
                        size="sm"
                        onClick={() => setIsSimulateOpen(true)}
                        className="bg-indigo-600 text-white text-xs font-bold"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1 text-cyan-300" />
                        Simulate Test Failure
                      </Button>
                    )}
                  </div>
                ) : (
                  filteredFailures.map((f) => {
                    const run = f.analysisRuns?.[0];
                    const isSelected = selectedId === f.id;
                    return (
                      <div
                        key={f.id}
                        onClick={() => setSelectedId(f.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group flex flex-col gap-2 ${
                          isSelected
                            ? 'bg-slate-900 border-indigo-500/80 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                            : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                        }`}
                      >
                        {/* Top metadata */}
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono font-bold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
                            {f.commitSha.slice(0, 7)}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(f.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <button
                              onClick={(e) => handleDeleteFailure(e, f.id)}
                              className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                              title="Delete Incident Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Repo & Workflow */}
                        <div>
                          <p className="font-bold text-xs text-slate-100 truncate">
                            {f.repository.repoName}
                          </p>
                          {f.workflowName && (
                            <p className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-1 font-mono">
                              <Terminal className="w-3 h-3 text-slate-500 flex-shrink-0" />
                              <span>{f.workflowName}</span>
                            </p>
                          )}
                        </div>

                        {/* Error preview snippet */}
                        {f.errorSummary && (
                          <p className="text-[10px] text-red-400/80 font-mono truncate bg-red-950/20 px-2 py-1 rounded border border-red-900/30">
                            {f.errorSummary}
                          </p>
                        )}

                        {/* Bottom Row */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                          {getStatusBadge(f.status, run?.reviewStatus)}
                          {f.branchName && (
                            <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 max-w-[130px] truncate">
                              <GitBranch className="w-3 h-3 text-indigo-400 flex-shrink-0" />
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
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Incident Diagnostic Container Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
              
              {/* Header Bar */}
              <div className="p-6 bg-slate-950/80 border-b border-slate-800 flex flex-row items-start justify-between flex-wrap gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      INCIDENT DIAGNOSTIC
                    </span>
                    {selected && getStatusBadge(selected.status, latestRun?.reviewStatus)}
                  </div>
                  <h1 className="text-xl font-extrabold tracking-tight text-white mt-1">
                    {selected ? selected.repository.repoName : 'Select a failure incident'}
                  </h1>
                  {selected && (
                    <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-1.5 flex-wrap">
                      <div className="flex items-center gap-1">
                        <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{selected.branchName || 'main'}</span>
                        <button
                          onClick={handleCopyBranch}
                          className="text-slate-500 hover:text-slate-300 ml-0.5"
                          title="Copy Branch"
                        >
                          {copiedBranch ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <span className="text-slate-700">•</span>
                      <div className="flex items-center gap-1">
                        <span>SHA: {selected.commitSha.slice(0, 8)}</span>
                        <button
                          onClick={handleCopySha}
                          className="text-slate-500 hover:text-slate-300 ml-0.5"
                          title="Copy Commit SHA"
                        >
                          {copiedSha ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      {selected.workflowRunId && (
                        <>
                          <span className="text-slate-700">•</span>
                          <span>Run #{selected.workflowRunId}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {selected && (
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <Button
                      onClick={(e) => handleDeleteFailure(e, selected.id)}
                      variant="outline"
                      size="sm"
                      className="border-slate-800 text-slate-400 hover:text-red-400 hover:bg-red-950/20"
                      leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                    >
                      Delete
                    </Button>
                    <Button
                      onClick={triggerHeal}
                      isLoading={healing}
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-600/20"
                    >
                      {healing ? 'Analyzing Pipeline...' : selected.status === 'pending' ? 'Initiate AI Heal' : 'Re-Run AI Heal'}
                    </Button>
                  </div>
                )}
              </div>

              {/* Main Content Area */}
              <div className="p-6 space-y-6">
                {!selected ? (
                  <div className="py-24 text-center space-y-4">
                    <Terminal className="w-12 h-12 text-slate-700 mx-auto" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-300">No Incident Loaded</h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 font-mono">
                        Select an incident from the stream on the left or simulate a new failure to inspect AI diagnostics and code patches.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setIsSimulateOpen(true)}
                      className="bg-indigo-600 text-white text-xs font-bold"
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1.5 text-cyan-300" />
                      Simulate Test Failure
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Pipeline Stage Visualizer */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                          Autonomous Healing Stepper
                        </span>
                        {latestRun?.executionTimeMs && (
                          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{(latestRun.executionTimeMs / 1000).toFixed(2)}s execution</span>
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                        {[
                          { label: '1. Ingest Webhook', done: true, current: false, desc: 'Intercepted failure' },
                          { label: '2. Gemini Root Cause', done: !!latestRun, current: selected.status === 'analyzing', desc: 'Analyzed trace logs' },
                          { label: '3. GPT-OSS Patch', done: !!latestRun?.patch, current: false, desc: 'Compiled diff' },
                          { label: '4. Safety Review', done: !!latestRun?.reviewStatus, current: false, desc: latestRun?.reviewStatus || 'Pending' },
                          { label: '5. Auto PR Dispatch', done: !!latestRun?.prLink, current: false, desc: latestRun?.prLink ? 'PR staged' : 'Conditional' },
                        ].map((step, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl border transition-all flex flex-col gap-1 ${
                              step.done
                                ? 'bg-indigo-950/20 border-indigo-500/40 text-slate-200'
                                : step.current
                                ? 'bg-indigo-950/40 border-indigo-400 ring-1 ring-indigo-400/30 text-white animate-pulse'
                                : 'bg-slate-950/30 border-slate-800/60 opacity-40 text-slate-500'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold font-mono uppercase tracking-wider">
                                {step.label}
                              </span>
                              {step.done ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : step.current ? (
                                <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-slate-700" />
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono truncate">
                              {step.desc}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Diagnostics Cards */}
                    {latestRun ? (
                      <div className="space-y-6 pt-2 border-t border-slate-800">
                        {/* 3 Overview Info Chips */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                          {/* Category */}
                          <div className="bg-slate-950/60 rounded-xl border border-slate-800 p-3.5 flex flex-col justify-between gap-2">
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                              Error Classification
                            </span>
                            <div>{renderCategoryTag(latestRun.category)}</div>
                          </div>

                          {/* Confidence */}
                          <div className="bg-slate-950/60 rounded-xl border border-slate-800 p-3.5 flex flex-col justify-between gap-2">
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                              AI Confidence Score
                            </span>
                            <div>
                              <div className="flex items-center justify-between text-xs font-bold font-mono text-slate-200 mb-1">
                                <span>{(latestRun.confidence * 100).toFixed(0)}%</span>
                                <span className="text-[10px] text-indigo-400">Deterministic</span>
                              </div>
                              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-500"
                                  style={{ width: `${latestRun.confidence * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Risk Level */}
                          <div className="bg-slate-950/60 rounded-xl border border-slate-800 p-3.5 flex flex-col justify-between gap-2">
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                              Safety Risk Index
                            </span>
                            <div>
                              {latestRun.reviewRiskLevel ? (
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-bold capitalize ${
                                  latestRun.reviewRiskLevel === 'high'
                                    ? 'text-red-400 bg-red-500/10 border-red-500/30'
                                    : latestRun.reviewRiskLevel === 'medium'
                                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                                    : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                                }`}>
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span>{latestRun.reviewRiskLevel} Risk</span>
                                </span>
                              ) : (
                                <span className="text-slate-500 text-xs">—</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Root Cause Details */}
                        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Gemini Diagnosis & Root Cause</span>
                            </span>
                            {latestRun.affectedFile && (
                              <span className="text-[11px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                                {latestRun.affectedFile}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-200 leading-relaxed font-mono">
                            {latestRun.rootCause}
                          </p>
                        </div>

                        {/* Validator Verdict Alert */}
                        {latestRun.reviewReason && (
                          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                            latestRun.reviewStatus === 'approved'
                              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                              : 'bg-red-950/20 border-red-500/30 text-red-300'
                          }`}>
                            {latestRun.reviewStatus === 'approved' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="space-y-1">
                              <span className="text-[11px] font-bold uppercase tracking-wider font-mono block">
                                GPT-OSS-120B Validator Verdict: {latestRun.reviewStatus?.toUpperCase()}
                              </span>
                              <p className="text-xs font-mono leading-relaxed">
                                {latestRun.reviewReason}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Generated Patch Diff Viewer */}
                        {latestRun.patch && (
                          <div className="space-y-2">
                            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                              Synthesized Autonomous Code Fix
                            </span>
                            <DiffViewer patch={latestRun.patch} filename={latestRun.affectedFile} />
                          </div>
                        )}

                        {/* PR Banner */}
                        {latestRun.prLink && (
                          <div className="p-4 bg-gradient-to-r from-indigo-950/60 to-slate-900 border border-indigo-500/40 rounded-xl flex items-center justify-between flex-wrap gap-4 shadow-lg">
                            <div className="space-y-1">
                              <h4 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                                <GitPullRequest className="w-4 h-4 text-indigo-400" />
                                <span>Pull Request Staged on GitHub</span>
                              </h4>
                              <p className="text-[11px] text-slate-400 font-mono">
                                Branch: <span className="text-indigo-300 font-bold">{latestRun.prBranch || 'healix/fix'}</span>
                              </p>
                            </div>
                            <a
                              href={latestRun.prLink}
                              target="_blank"
                              rel="noreferrer"
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                            >
                              <span>View PR on GitHub</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* When no analysis run exists yet */
                      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                          <span className="text-xs font-bold text-slate-200">Failure Staged — Diagnosis Pending</span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono leading-relaxed">
                          This incident was captured from the CI/CD pipeline. Click "Initiate AI Heal" above to analyze the error logs and generate a validated code repair.
                        </p>
                      </div>
                    )}

                    {/* Expandable Raw Terminal Logs Drawer */}
                    {(selected.logs || selected.errorSummary) && (
                      <div className="border border-slate-800 rounded-xl bg-slate-950 overflow-hidden">
                        <button
                          onClick={() => setShowLogsDrawer(!showLogsDrawer)}
                          className="w-full px-4 py-2.5 bg-slate-950 flex items-center justify-between text-xs font-mono font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Raw CI/CD Pipeline Trace Logs</span>
                          </div>
                          {showLogsDrawer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {showLogsDrawer && (
                          <div className="p-4 bg-slate-950 border-t border-slate-800 max-h-80 overflow-y-auto">
                            <pre className="font-mono text-[11px] text-red-400/90 whitespace-pre-wrap leading-relaxed select-text">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category Breakdown */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                    Failure Categories Distribution
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">Classification</span>
                </div>
                {analytics && Object.keys(analytics.categoryBreakdown).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(analytics.categoryBreakdown).map(([cat, count]) => {
                      const total = Object.values(analytics.categoryBreakdown).reduce((a, b) => a + b, 0);
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                      return (
                        <div key={cat} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold">{renderCategoryTag(cat)}</span>
                            <span className="font-mono text-slate-400 font-bold">{count} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-500 italic font-mono">
                    No category telemetry available yet.
                  </div>
                )}
              </div>

              {/* Risk Distribution */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                    AI Safety & Risk Distribution
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">Audit Index</span>
                </div>
                {analytics && Object.keys(analytics.riskLevelBreakdown).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(analytics.riskLevelBreakdown).map(([risk, count]) => {
                      const total = Object.values(analytics.riskLevelBreakdown).reduce((a, b) => a + b, 0);
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                      const color =
                        risk === 'high' ? 'bg-red-500 text-red-400' : risk === 'medium' ? 'bg-amber-500 text-amber-400' : 'bg-emerald-500 text-emerald-400';
                      return (
                        <div key={risk} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className={`font-mono font-bold capitalize ${color.split(' ')[1]}`}>
                              {risk} Risk
                            </span>
                            <span className="font-mono text-slate-400 font-bold">{count} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${color.split(' ')[0]} rounded-full transition-all duration-500`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-500 italic font-mono">
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
    </div>
  );
}

function MetricCard({
  label,
  value,
  subtext,
  icon,
  accent,
  badgeText,
}: {
  label: string;
  value: string | number;
  subtext: string;
  icon: React.ReactNode;
  accent: string;
  badgeText?: string;
}) {
  return (
    <div className={`p-5 rounded-2xl border ${accent} bg-slate-900 shadow-xl flex flex-col justify-between transition-all hover:border-slate-700`}>
      <div className="flex items-start justify-between">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        <div className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black font-mono tracking-tight text-white leading-none">
            {value}
          </span>
          {badgeText && (
            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
              {badgeText}
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-400 font-mono mt-1.5 leading-snug">
          {subtext}
        </p>
      </div>
    </div>
  );
}
