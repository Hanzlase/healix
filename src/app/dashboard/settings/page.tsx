'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SessionManager, SessionState } from '@/lib/session-manager';
import { getSession } from 'next-auth/react';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  ChevronRight, 
  AlertCircle, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  BookOpen, 
  AlertTriangle,
  Sliders,
  FileJson,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Zap,
  RefreshCw,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [githubTokenInput, setGithubTokenInput] = useState('');
  const [showTokenHelp, setShowTokenHelp] = useState(false);
  const [webhookSecret, setWebhookSecret] = useState('loading...');
  const [pingStatus, setPingStatus] = useState<string | null>(null);
  const [pingLoading, setPingLoading] = useState(false);

  const webhookUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/github` : '/api/webhooks/github';

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

      try {
        const configRes = await fetch('/api/config');
        const configData = await configRes.json();
        if (configData.webhookSecret) {
          setWebhookSecret(configData.webhookSecret);
        }
      } catch (err) {
        console.error('Failed to load webhook secret', err);
      }
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
    if (confirm('Reset all local session data? This will clear guest caches.')) { 
      SessionManager.reset(); 
      window.location.href = '/dashboard';
    }
  };

  const handleExport = () => SessionManager.exportData();

  const handleAddRepo = async () => {
    let cleanRepo = repoInput.trim();
    if (cleanRepo.startsWith('http')) {
      try {
        const url = new URL(cleanRepo);
        const pathParts = url.pathname.replace(/^\/|\/$/g, '').split('/');
        if (pathParts.length >= 2) {
          cleanRepo = `${pathParts[0]}/${pathParts[1].replace('.git', '')}`;
        }
      } catch (e) {
        // ignore
      }
    }
    
    if (!cleanRepo.includes('/') || cleanRepo.split('/').length !== 2) { 
      setAddError('Format must be owner/repository (e.g. facebook/react)'); 
      return; 
    }
    setAdding(true); setAddError(''); setAddSuccess('');
    try {
      const res = await fetch('/api/repositories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          repoFullName: cleanRepo, 
          autoPrEnabled: session?.autoPrEnabled ?? true,
          githubToken: githubTokenInput.trim() || null,
        }),
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
      setGithubTokenInput('');
      setAddSuccess(`Connected ${cleanRepo} successfully!`);
      setTimeout(() => setAddSuccess(''), 4000);
    } catch { 
      setAddError('Could not add repository. Ensure it exists.'); 
    } finally { 
      setAdding(false); 
    }
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
      alert('Failed to update repository auto-PR settings');
    }
  };

  const handleCopyWebhook = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(webhookSecret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTestWebhookRoute = async () => {
    setPingLoading(true);
    setPingStatus(null);
    try {
      // Send a dummy test ping to check route accessibility
      const res = await fetch('/api/webhooks/github', {
        method: 'POST',
        headers: {
          'x-github-event': 'ping',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ zen: 'Healix autonomous CI test' }),
      });
      const data = await res.json();
      if (res.ok) {
        setPingStatus('Webhook listener endpoint is reachable and responsive (200 OK)');
      } else {
        setPingStatus(`Endpoint returned: ${data.reason || data.error || res.statusText}`);
      }
    } catch (err: any) {
      setPingStatus(`Ping error: ${err?.message || 'Connection failed'}`);
    } finally {
      setPingLoading(false);
    }
  };

  if (!session) return null;

  return (
    <main className="min-h-screen bg-[#090D16] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <nav className="bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-40 px-6 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard" 
              className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                Settings & Integration
              </h1>
              <p className="text-[11px] text-slate-400 font-mono">Repositories, Webhooks & Pipeline Automation</p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
          >
            <span>Live Console</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        
        {/* Quick Setup Card */}
        <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  SETUP IN THREE STEPS
                </span>
                <h2 className="text-lg font-bold text-white mt-1">Autonomous Failure Healing Walkthrough</h2>
              </div>
              <Badge variant="info" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-mono">
                Webhook Active
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
              <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 space-y-1.5">
                <span className="w-6 h-6 rounded bg-indigo-600/30 text-indigo-400 font-mono text-xs font-bold flex items-center justify-center">1</span>
                <h4 className="text-xs font-bold text-slate-200">Connect Repository</h4>
                <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
                  Enter your GitHub repository name (e.g. <code className="text-indigo-300">facebook/react</code>) below.
                </p>
              </div>

              <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 space-y-1.5">
                <span className="w-6 h-6 rounded bg-indigo-600/30 text-indigo-400 font-mono text-xs font-bold flex items-center justify-center">2</span>
                <h4 className="text-xs font-bold text-slate-200">Add GitHub Webhook</h4>
                <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
                  Paste the Payload URL in repo settings and choose <strong>Workflow runs</strong>.
                </p>
              </div>

              <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 space-y-1.5">
                <span className="w-6 h-6 rounded bg-indigo-600/30 text-indigo-400 font-mono text-xs font-bold flex items-center justify-center">3</span>
                <h4 className="text-xs font-bold text-slate-200">Automatic Repairs</h4>
                <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
                  When CI fails, Healix diagnoses root cause, builds a diff, and opens a fix PR!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Connect Repository Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                <span>Connect GitHub Repository</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                Track failure events and open autonomous PRs for this project
              </p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Repository Full Name *
                </label>
                <input
                  type="text"
                  placeholder="owner/repository (e.g. Hanzlase/healixtesting)"
                  value={repoInput}
                  onChange={(e) => { setRepoInput(e.target.value); setAddError(''); setAddSuccess(''); }}
                  disabled={adding}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    GitHub PAT (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowTokenHelp(!showTokenHelp)}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-mono underline"
                  >
                    {showTokenHelp ? 'Hide Help' : 'How to get PAT?'}
                  </button>
                </div>
                <input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxx"
                  value={githubTokenInput}
                  onChange={(e) => { setGithubTokenInput(e.target.value); setAddError(''); setAddSuccess(''); }}
                  disabled={adding}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
                />
              </div>
            </div>

            {showTokenHelp && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs font-mono text-slate-300">
                <h4 className="font-bold text-indigo-400">GitHub Personal Access Token Guide:</h4>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-400 leading-relaxed text-[11px]">
                  <li>Navigate to GitHub &rarr; <strong>Settings</strong> &rarr; <strong>Developer Settings</strong> &rarr; <strong>Personal Access Tokens</strong>.</li>
                  <li>Create a token with the <strong>repo</strong> scope (full control of repositories) or Fine-Grained token with <strong>Contents: Read/Write</strong> & <strong>Pull Requests: Read/Write</strong>.</li>
                  <li>Paste the token above to enable seamless private repo branch creation and automated PR submission.</li>
                </ol>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div>
                {addError && (
                  <p className="text-xs font-mono text-red-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{addError}</span>
                  </p>
                )}
                {addSuccess && (
                  <p className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{addSuccess}</span>
                  </p>
                )}
              </div>
              <Button
                onClick={handleAddRepo}
                disabled={!repoInput.trim()}
                isLoading={adding}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
              >
                Connect Repository
              </Button>
            </div>
          </div>
        </div>

        {/* Connected Repositories List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Active Repositories ({repos.length})</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Managed by Healix Engine</span>
          </div>

          <div className="divide-y divide-slate-800">
            {repos.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <p className="text-xs font-bold text-slate-400 font-mono">No repositories linked yet</p>
                <p className="text-[11px] text-slate-600 font-mono">Connect your first repo above to begin automatic failure healing.</p>
              </div>
            ) : (
              repos.map((r) => (
                <div key={r.id} className="p-5 flex items-center justify-between flex-wrap gap-4 hover:bg-slate-950/40 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-indigo-400">
                      <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">{r.repoName}</span>
                        {r.repoName.includes('/') && (
                          <a
                            href={`https://github.com/${r.repoName}/settings/hooks`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-500 hover:text-slate-300 text-[10px] font-mono flex items-center gap-1"
                            title="Open GitHub Webhook Settings"
                          >
                            <span>Webhook Settings</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-slate-400">
                        <span>{r._count?.failures ?? 0} failures tracked</span>
                        <span>•</span>
                        <span>Added {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'recently'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-5">
                    {/* Auto PR toggle */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                        Auto PR
                      </span>
                      <button
                        onClick={() => handleToggleRepoAutoPr(r.id, r.autoPrEnabled)}
                        className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title={r.autoPrEnabled ? 'Disable Auto PR' : 'Enable Auto PR'}
                      >
                        {r.autoPrEnabled ? (
                          <ToggleRight className="w-7 h-7 text-emerald-400" />
                        ) : (
                          <ToggleLeft className="w-7 h-7 text-slate-600" />
                        )}
                      </button>
                    </div>

                    {/* Delete repository */}
                    <button
                      onClick={() => handleDeleteRepo(r.id, r.repoName)}
                      disabled={deletingRepo === r.id}
                      className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-500 hover:text-red-400 hover:bg-red-950/20 transition-colors cursor-pointer"
                      title="Disconnect repository"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* GitHub Webhook Configuration Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>GitHub Webhook Configuration</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                Receives GitHub Actions failure payloads and triggers the healing pipeline
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestWebhookRoute}
                isLoading={pingLoading}
                className="border-slate-800 text-xs font-mono"
              >
                Test Endpoint Ping
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowWebhookGuide(!showWebhookGuide)}
                className="border-slate-800 text-xs"
              >
                {showWebhookGuide ? 'Hide Instructions' : 'Setup Guide'}
              </Button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {pingStatus && (
              <div className="p-3.5 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-xs font-mono text-indigo-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 flex-shrink-0 text-cyan-300" />
                <span>{pingStatus}</span>
              </div>
            )}

            {showWebhookGuide && (
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono space-y-3 text-slate-300">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span>GitHub Webhook Installation Steps</span>
                </h4>
                <ol className="list-decimal pl-4 space-y-2 text-slate-400 text-[11px] leading-relaxed">
                  <li>In your GitHub repo, click <strong>Settings</strong> &rarr; <strong>Webhooks</strong> &rarr; <strong>Add webhook</strong>.</li>
                  <li>Paste the <strong>Payload URL</strong> below.</li>
                  <li>Select Content type as <code className="text-indigo-300 bg-slate-900 px-1 py-0.5 rounded">application/json</code>.</li>
                  <li>Paste the <strong>Secret Key</strong> below into the GitHub secret field.</li>
                  <li>Under events, select <strong>Let me select individual events</strong> and check <strong>Workflow runs</strong>.</li>
                  <li>Click <strong>Add webhook</strong> to activate instant failure monitoring!</li>
                </ol>
              </div>
            )}

            {/* Payload URL */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                Payload URL
              </span>
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-2.5">
                <code className="flex-1 text-xs font-mono text-slate-200 truncate select-all">
                  {webhookUrl}
                </code>
                <button
                  onClick={handleCopyWebhook}
                  className="px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                >
                  {copiedWebhook ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Secret Key & Content Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  Content Type
                </span>
                <div className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <code className="text-xs font-mono text-slate-300">application/json</code>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  HMAC SHA-256 Secret Key
                </span>
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <code className="text-xs font-mono text-slate-300 truncate max-w-[200px]">
                    {webhookSecret}
                  </code>
                  <button
                    onClick={handleCopySecret}
                    className="text-slate-400 hover:text-white text-xs font-mono flex items-center gap-1 cursor-pointer"
                  >
                    {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Automation Presets */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
            <div className="space-y-1 max-w-lg">
              <h4 className="text-xs font-bold text-slate-200">Autonomous PR Proposal Creation</h4>
              <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
                When enabled, Healix automatically creates fix branches and submits pull requests after AI safety verification.
              </p>
            </div>
            <button
              onClick={handleToggleAutoPr}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              title={session.autoPrEnabled ? 'Disable auto PR' : 'Enable auto PR'}
            >
              {session.autoPrEnabled ? (
                <ToggleRight className="w-8 h-8 text-emerald-400" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-slate-600" />
              )}
            </button>
          </div>
        </div>

        {/* Danger Zone & Data Export */}
        <div className="border border-red-500/20 bg-red-950/10 rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider font-mono">
            Session & Cache Controls
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-indigo-400" />
                  <span>Export Session Telemetry</span>
                </h4>
                <p className="text-[11px] text-slate-400 font-mono mt-1">
                  Download your local repository session and failure traces as JSON.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleExport} className="w-full text-xs font-mono border-slate-800">
                Export JSON
              </Button>
            </div>

            <div className="p-4 bg-slate-950 border border-red-500/30 rounded-xl space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-red-300 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-red-400" />
                  <span>Reset Guest Workspace</span>
                </h4>
                <p className="text-[11px] text-slate-400 font-mono mt-1">
                  Clears local storage caches and resets guest mode session records.
                </p>
              </div>
              <Button variant="danger" size="sm" onClick={handleReset} className="w-full text-xs font-mono">
                Reset Workspace Cache
              </Button>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
