'use client';

import { useEffect, useState } from 'react';
import { SessionManager, SessionState } from '@/lib/session-manager';
import { getSession } from 'next-auth/react';
import { 
  Copy, 
  Check, 
  AlertCircle, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  BookOpen, 
  FileJson, 
  RotateCcw, 
  ExternalLink, 
  ShieldCheck, 
  Plus,
  GitBranch,
  KeyRound,
  Sparkles,
  Radio
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppShell } from '@/components/app-shell';

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
  const [userEmail, setUserEmail] = useState<string | null>(null);
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
      const authed = !!nextSession?.user;
      setIsAuth(authed);
      if (nextSession?.user?.email) setUserEmail(nextSession.user.email);
      
      const localSess = SessionManager.get();
      localSess.mode = authed ? 'authenticated' : 'guest';
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
      } catch {
        // ignore invalid URL parsing
      }
    }
    
    if (!cleanRepo.includes('/') || cleanRepo.split('/').length !== 2) { 
      setAddError('Format must be owner/repository (e.g. facebook/react)'); 
      return; 
    }
    setAdding(true); 
    setAddError(''); 
    setAddSuccess('');
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
      setAddSuccess(`Connected ${cleanRepo} successfully.`);
      setTimeout(() => setAddSuccess(''), 4000);
    } catch { 
      setAddError('Could not add repository. Ensure it exists on GitHub.'); 
    } finally { 
      setAdding(false); 
    }
  };

  const handleDeleteRepo = async (repoId: string, repoName: string) => {
    if (!confirm(`Remove ${repoName} from Healix monitoring?`)) return;
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
        setPingStatus('Webhook listener endpoint reachable (HTTP 200 OK)');
      } else {
        setPingStatus(`Endpoint returned: ${data.reason || data.error || res.statusText}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      setPingStatus(`Ping error: ${msg}`);
    } finally {
      setPingLoading(false);
    }
  };

  return (
    <AppShell
      userEmail={userEmail}
      isAuthed={isAuth}
      activeRepo={repos[0]?.repoName}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Page Title Header */}
        <div>
          <h2 className="text-base font-bold text-[#20221F]">
            Integrations & Pipeline Automation
          </h2>
          <p className="text-xs text-[#696D65] mt-0.5">
            Manage monitored GitHub repositories, webhook secrets, Personal Access Tokens, and automated Pull Request rules.
          </p>
        </div>

        {/* 3-Step Setup Guide */}
        <div className="bg-[#FFFFFF] border border-[#DDDFD7] rounded-lg p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-[#D65A31] uppercase tracking-wider">
              Setup Architecture
            </span>
            <Badge variant="success">
              <Radio className="w-3 h-3" />
              <span>Listener Active</span>
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-3 bg-[#F5F4EF] rounded-md border border-[#DDDFD7] space-y-1">
              <span className="w-5 h-5 rounded bg-[#20221F] text-white font-mono text-[11px] font-bold flex items-center justify-center">1</span>
              <h4 className="text-xs font-semibold text-[#20221F]">Add Repository</h4>
              <p className="text-[11px] text-[#696D65] leading-normal font-mono">
                Specify your GitHub <code className="text-[#20221F]">owner/repo</code> target.
              </p>
            </div>

            <div className="p-3 bg-[#F5F4EF] rounded-md border border-[#DDDFD7] space-y-1">
              <span className="w-5 h-5 rounded bg-[#20221F] text-white font-mono text-[11px] font-bold flex items-center justify-center">2</span>
              <h4 className="text-xs font-semibold text-[#20221F]">Configure Webhook</h4>
              <p className="text-[11px] text-[#696D65] leading-normal font-mono">
                Subscribe to GitHub <code className="text-[#20221F]">workflow_run</code> failure events.
              </p>
            </div>

            <div className="p-3 bg-[#F5F4EF] rounded-md border border-[#DDDFD7] space-y-1">
              <span className="w-5 h-5 rounded bg-[#20221F] text-white font-mono text-[11px] font-bold flex items-center justify-center">3</span>
              <h4 className="text-xs font-semibold text-[#20221F]">Autonomous PRs</h4>
              <p className="text-[11px] text-[#696D65] leading-normal font-mono">
                Healix analyzes failure logs, verifies code fix safety, and opens PR.
              </p>
            </div>
          </div>
        </div>

        {/* Connect Repository Card */}
        <div className="bg-[#FFFFFF] border border-[#DDDFD7] rounded-lg shadow-2xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#DDDFD7] bg-[#F5F4EF] flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#20221F] flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-[#D65A31]" />
                <span>Connect GitHub Repository</span>
              </h3>
              <p className="text-[11px] text-[#696D65] mt-0.5">
                Track failure events and generate automated remediation PRs for this project.
              </p>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#696D65]">
                  Repository Full Name *
                </label>
                <input
                  type="text"
                  placeholder="owner/repository (e.g. Hanzlase/healixtesting)"
                  value={repoInput}
                  onChange={(e) => { setRepoInput(e.target.value); setAddError(''); setAddSuccess(''); }}
                  disabled={adding}
                  className="w-full px-3 py-2 bg-white border border-[#DDDFD7] rounded-md text-xs font-mono text-[#20221F] placeholder:text-[#A8ABA2] focus:outline-none focus:border-[#D65A31] focus:ring-1 focus:ring-[#D65A31]"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#696D65]">
                    GitHub PAT (Optional for Private Repos)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowTokenHelp(!showTokenHelp)}
                    className="text-[11px] text-[#D65A31] hover:underline font-mono"
                  >
                    {showTokenHelp ? 'Hide guide' : 'Token help'}
                  </button>
                </div>
                <input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={githubTokenInput}
                  onChange={(e) => { setGithubTokenInput(e.target.value); setAddError(''); setAddSuccess(''); }}
                  disabled={adding}
                  className="w-full px-3 py-2 bg-white border border-[#DDDFD7] rounded-md text-xs font-mono text-[#20221F] placeholder:text-[#A8ABA2] focus:outline-none focus:border-[#D65A31] focus:ring-1 focus:ring-[#D65A31]"
                />
              </div>
            </div>

            {showTokenHelp && (
              <div className="p-4 bg-[#F5F4EF] border border-[#DDDFD7] rounded-md space-y-1.5 text-xs font-mono text-[#20221F]">
                <h4 className="font-semibold text-[#20221F] flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#D65A31]" />
                  <span>Personal Access Token Requirements:</span>
                </h4>
                <ol className="list-decimal pl-4 space-y-1 text-[#696D65] text-[11px] leading-relaxed">
                  <li>In GitHub, navigate to <strong>Settings</strong> &rarr; <strong>Developer Settings</strong> &rarr; <strong>Personal Access Tokens</strong>.</li>
                  <li>Grant the token <code className="text-[#20221F]">repo</code> scope (Full control of repositories) or fine-grained permissions for <strong>Contents: Read/Write</strong> and <strong>Pull Requests: Read/Write</strong>.</li>
                  <li>Save the token here to permit Healix to checkout branches and submit PRs automatically.</li>
                </ol>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <div>
                {addError && (
                  <p className="text-xs font-mono text-[#B83D38] flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{addError}</span>
                  </p>
                )}
                {addSuccess && (
                  <p className="text-xs font-mono text-[#26764F] flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{addSuccess}</span>
                  </p>
                )}
              </div>
              <Button
                variant="primary"
                onClick={handleAddRepo}
                disabled={!repoInput.trim()}
                isLoading={adding}
                size="sm"
              >
                Connect Repository
              </Button>
            </div>
          </div>
        </div>

        {/* Active Repositories List */}
        <div className="bg-[#FFFFFF] border border-[#DDDFD7] rounded-lg shadow-2xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#DDDFD7] bg-[#F5F4EF] flex items-center justify-between">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#20221F] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#26764F]" />
              <span>Active Repositories ({repos.length})</span>
            </h3>
            <span className="text-[11px] text-[#696D65] font-mono">Managed by Healix</span>
          </div>

          <div className="divide-y divide-[#DDDFD7]">
            {repos.length === 0 ? (
              <div className="p-8 text-center space-y-1.5">
                <p className="text-xs font-semibold text-[#20221F]">No repositories linked yet</p>
                <p className="text-[11px] text-[#696D65] font-mono">Connect your first repository above to begin monitoring workflow failures.</p>
              </div>
            ) : (
              repos.map((r) => (
                <div key={r.id} className="p-4 flex items-center justify-between flex-wrap gap-4 hover:bg-[#F5F4EF] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-[#ECEDE7] border border-[#DDDFD7] flex items-center justify-center text-[#20221F]">
                      <GitBranch className="w-4 h-4 text-[#D65A31]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#20221F] font-mono">{r.repoName}</span>
                        {r.repoName.includes('/') && (
                          <a
                            href={`https://github.com/${r.repoName}/settings/hooks`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#696D65] hover:text-[#20221F] text-[10px] font-mono flex items-center gap-1"
                            title="Open GitHub Webhook Settings"
                          >
                            <span>Webhook Settings</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-[#696D65]">
                        <span>{r._count?.failures ?? 0} failures tracked</span>
                        <span>•</span>
                        <span>Added {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'recently'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Auto PR toggle */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-semibold text-[#696D65] uppercase tracking-wider">
                        Auto PR
                      </span>
                      <button
                        onClick={() => handleToggleRepoAutoPr(r.id, r.autoPrEnabled)}
                        className="text-[#696D65] hover:text-[#20221F] transition-colors cursor-pointer"
                        title={r.autoPrEnabled ? 'Disable Auto PR' : 'Enable Auto PR'}
                      >
                        {r.autoPrEnabled ? (
                          <ToggleRight className="w-7 h-7 text-[#26764F]" />
                        ) : (
                          <ToggleLeft className="w-7 h-7 text-[#C4C7BE]" />
                        )}
                      </button>
                    </div>

                    {/* Delete repository */}
                    <button
                      onClick={() => handleDeleteRepo(r.id, r.repoName)}
                      disabled={deletingRepo === r.id}
                      className="p-1.5 rounded text-[#696D65] hover:text-[#B83D38] hover:bg-[#F8E9E6] transition-colors cursor-pointer"
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
        <div className="bg-[#FFFFFF] border border-[#DDDFD7] rounded-lg shadow-2xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#DDDFD7] bg-[#F5F4EF] flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#20221F] flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#D65A31]" />
                <span>GitHub Webhook Integration</span>
              </h3>
              <p className="text-[11px] text-[#696D65] mt-0.5">
                Receives GitHub Actions failure events and automatically triggers the remediation pipeline.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestWebhookRoute}
                isLoading={pingLoading}
              >
                Test Endpoint Ping
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowWebhookGuide(!showWebhookGuide)}
              >
                {showWebhookGuide ? 'Hide Guide' : 'Setup Guide'}
              </Button>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {pingStatus && (
              <div className="p-3 bg-[#E8F2EA] border border-[#C3DEC8] rounded-md text-xs font-mono text-[#26764F] flex items-center gap-2">
                <Sparkles className="w-4 h-4 flex-shrink-0" />
                <span>{pingStatus}</span>
              </div>
            )}

            {showWebhookGuide && (
              <div className="p-4 bg-[#F5F4EF] border border-[#DDDFD7] rounded-md text-xs font-mono space-y-2 text-[#20221F]">
                <h4 className="font-semibold text-[#20221F]">GitHub Webhook Configuration Steps:</h4>
                <ol className="list-decimal pl-4 space-y-1.5 text-[#696D65] text-[11px] leading-relaxed">
                  <li>In your GitHub repo, go to <strong>Settings</strong> &rarr; <strong>Webhooks</strong> &rarr; <strong>Add webhook</strong>.</li>
                  <li>Paste the <strong>Payload URL</strong> below into the GitHub payload URL field.</li>
                  <li>Set Content type to <code className="text-[#20221F] bg-[#ECEDE7] px-1 py-0.5 rounded">application/json</code>.</li>
                  <li>Paste the <strong>HMAC SHA-256 Secret</strong> below into the GitHub secret field.</li>
                  <li>Under events, choose <strong>Let me select individual events</strong> and check <strong>Workflow runs</strong>.</li>
                  <li>Click <strong>Add webhook</strong> to complete setup.</li>
                </ol>
              </div>
            )}

            {/* Payload URL */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#696D65] block">
                Payload URL
              </span>
              <div className="flex items-center gap-2 bg-[#F5F4EF] border border-[#DDDFD7] rounded-md p-2">
                <code className="flex-1 text-xs font-mono text-[#20221F] truncate select-all">
                  {webhookUrl}
                </code>
                <button
                  onClick={handleCopyWebhook}
                  className="px-2.5 py-1 bg-white hover:bg-[#ECEDE7] border border-[#DDDFD7] rounded text-xs font-mono text-[#20221F] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {copiedWebhook ? <Check className="w-3.5 h-3.5 text-[#26764F]" /> : <Copy className="w-3.5 h-3.5 text-[#696D65]" />}
                  <span>{copiedWebhook ? 'Copied' : 'Copy URL'}</span>
                </button>
              </div>
            </div>

            {/* Secret Key & Content Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#696D65] block">
                  Content Type
                </span>
                <div className="px-3 py-2 bg-[#F5F4EF] border border-[#DDDFD7] rounded-md">
                  <code className="text-xs font-mono text-[#20221F]">application/json</code>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#696D65] block">
                  HMAC SHA-256 Secret Key
                </span>
                <div className="flex items-center justify-between px-3 py-2 bg-[#F5F4EF] border border-[#DDDFD7] rounded-md">
                  <code className="text-xs font-mono text-[#20221F] truncate max-w-[200px]">
                    {webhookSecret}
                  </code>
                  <button
                    onClick={handleCopySecret}
                    className="text-[#696D65] hover:text-[#20221F] text-xs font-mono flex items-center gap-1 cursor-pointer"
                  >
                    {copiedSecret ? <Check className="w-3.5 h-3.5 text-[#26764F]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Automation Presets */}
        {session && (
          <div className="bg-[#FFFFFF] border border-[#DDDFD7] rounded-lg shadow-2xs overflow-hidden p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5 max-w-lg">
                <h4 className="text-xs font-semibold text-[#20221F]">Autonomous PR Proposal Creation</h4>
                <p className="text-[11px] text-[#696D65] leading-normal font-mono">
                  When enabled, Healix automatically creates fix branches and submits pull requests after AI safety verification.
                </p>
              </div>
              <button
                onClick={handleToggleAutoPr}
                className="text-[#696D65] hover:text-[#20221F] transition-colors cursor-pointer"
                title={session.autoPrEnabled ? 'Disable auto PR' : 'Enable auto PR'}
              >
                {session.autoPrEnabled ? (
                  <ToggleRight className="w-7 h-7 text-[#26764F]" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-[#C4C7BE]" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Danger Zone & Data Export */}
        <div className="border border-[#ECC3BE] bg-[#F8E9E6]/30 rounded-lg p-5 space-y-4">
          <h3 className="text-xs font-bold text-[#B83D38] uppercase tracking-wider font-mono">
            Session & Cache Controls
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-[#FFFFFF] border border-[#DDDFD7] rounded-md space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-semibold text-[#20221F] flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-[#D65A31]" />
                  <span>Export Session Telemetry</span>
                </h4>
                <p className="text-[11px] text-[#696D65] font-mono mt-1 leading-normal">
                  Download your local repository session and failure traces as JSON.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleExport} className="w-full text-xs font-mono">
                Export JSON
              </Button>
            </div>

            <div className="p-4 bg-[#FFFFFF] border border-[#ECC3BE] rounded-md space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-semibold text-[#B83D38] flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-[#B83D38]" />
                  <span>Reset Guest Workspace</span>
                </h4>
                <p className="text-[11px] text-[#696D65] font-mono mt-1 leading-normal">
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
    </AppShell>
  );
}
