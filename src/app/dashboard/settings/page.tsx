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
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
    if (confirm('Reset all local session data? This will clear guest databases.')) { 
      SessionManager.reset(); 
      window.location.reload(); 
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
        body: JSON.stringify({ repoFullName: cleanRepo, autoPrEnabled: session?.autoPrEnabled ?? true }),
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
      setAddSuccess(`✓ Connected ${cleanRepo} successfully!`);
      setTimeout(() => setAddSuccess(''), 4000);
    } catch { 
      setAddError('Could not add repository. Ensure it exists and has webhook configurations.'); 
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

  if (!session) return null;

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-surface-900 font-sans">
      <div className="max-w-4xl mx-auto px-6 py-8">
        
        {/* Settings Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            href="/dashboard" 
            className="w-9 h-9 rounded-lg bg-white border border-surface-200 flex items-center justify-center hover:bg-surface-50 active:bg-surface-100 transition-smooth shadow-sm text-surface-650"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-surface-900">Settings</h1>
            <p className="text-xs text-surface-450 font-medium mt-0.5">Configure Healix integration and repository preferences</p>
          </div>
        </div>

        <div className="space-y-6">
          
          {/* Quick Start Guide */}
          <Card className="bg-surface-900 text-white border border-surface-850 relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-20" />
            <CardHeader className="relative z-10 border-b border-surface-800">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-white text-base">Quick Start Guide</CardTitle>
                  <CardDescription className="text-surface-400">Initialize Healix monitoring in 3 steps</CardDescription>
                </div>
                <Badge variant="info" className="bg-brand-500/20 text-brand-300 border-brand-500/30">Configuration</Badge>
              </div>
            </CardHeader>
            <CardContent className="relative z-10 p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-surface-800/40 rounded-lg p-4 border border-surface-800/60 space-y-2">
                <span className="w-6 h-6 bg-surface-800 text-white text-[10px] font-bold rounded flex items-center justify-center">1</span>
                <h4 className="text-xs font-bold text-white">Add repository</h4>
                <p className="text-[11px] text-surface-400 leading-relaxed font-medium">Link your repository using the connect field below.</p>
              </div>
              <div className="bg-surface-800/40 rounded-lg p-4 border border-surface-800/60 space-y-2">
                <span className="w-6 h-6 bg-surface-800 text-white text-[10px] font-bold rounded flex items-center justify-center">2</span>
                <h4 className="text-xs font-bold text-white">Setup Webhook</h4>
                <p className="text-[11px] text-surface-400 leading-relaxed font-medium">Configure GitHub webhook payloads to notify Healix of run errors.</p>
              </div>
              <div className="bg-surface-800/40 rounded-lg p-4 border border-surface-800/60 space-y-2">
                <span className="w-6 h-6 bg-surface-800 text-white text-[10px] font-bold rounded flex items-center justify-center">3</span>
                <h4 className="text-xs font-bold text-white">Automate fixes</h4>
                <p className="text-[11px] text-surface-400 leading-relaxed font-medium">Healix reviews failures, creates branches, and opens PRs.</p>
              </div>
            </CardContent>
          </Card>

          {/* Connect GitHub Repository */}
          <Card className="border border-surface-200/80">
            <CardHeader className="border-b border-surface-100 flex-row items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-50 border border-surface-200/60 flex items-center justify-center text-surface-700">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </div>
              <div>
                <CardTitle>Connect GitHub Repository</CardTitle>
                <CardDescription>Configure which repository logs Healix should analyze</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="bg-surface-50 border border-surface-200/60 rounded-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Input
                      placeholder="owner/repository (e.g. facebook/react)"
                      value={repoInput}
                      onChange={e => { setRepoInput(e.target.value); setAddError(''); setAddSuccess(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleAddRepo()}
                      disabled={adding}
                      className="h-10"
                    />
                  </div>
                  <Button
                    onClick={handleAddRepo}
                    disabled={!repoInput.trim()}
                    isLoading={adding}
                    className="h-10 text-xs font-bold uppercase tracking-wider px-5"
                  >
                    Add Repository
                  </Button>
                </div>
                
                {/* Form feedback */}
                {addError && (
                  <div className="flex items-start gap-2 text-xs font-semibold text-red-800 bg-red-50 border border-red-200 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-650 flex-shrink-0 mt-0.5" />
                    <span>{addError}</span>
                  </div>
                )}
                
                {addSuccess && (
                  <div className="flex items-start gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 rounded-lg">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{addSuccess}</span>
                  </div>
                )}
              </div>

              {/* Repositories List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-surface-500 uppercase tracking-wider">Connected Repositories</h3>
                
                {repos.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-surface-200 rounded-xl bg-surface-50/50">
                    <p className="text-xs font-bold text-surface-500">No repositories linked</p>
                    <p className="text-[11px] text-surface-400 mt-0.5">Use the input form above to connect your first project.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-surface-150 border border-surface-200/80 rounded-xl overflow-hidden bg-white">
                    {repos.map(r => (
                      <div 
                        key={r.id} 
                        className="flex items-center justify-between p-4 hover:bg-surface-50/40 transition-smooth flex-wrap gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-surface-900 flex items-center justify-center text-white">
                            <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-surface-900">{r.repoName}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-surface-450 font-semibold font-mono">
                              <span>{r._count?.failures ?? 0} failures tracked</span>
                              <span>•</span>
                              <span>Added {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'recently'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-5">
                          {/* Auto PR toggle */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider">Auto PR</span>
                            <button
                              onClick={() => handleToggleRepoAutoPr(r.id, r.autoPrEnabled)}
                              className="text-surface-500 hover:text-surface-900 transition-smooth cursor-pointer"
                              title={r.autoPrEnabled ? "Disable auto PR" : "Enable auto PR"}
                            >
                              {r.autoPrEnabled ? (
                                <ToggleRight className="w-7 h-7 text-emerald-600" />
                              ) : (
                                <ToggleLeft className="w-7 h-7 text-surface-400" />
                              )}
                            </button>
                          </div>

                          {/* Delete Action */}
                          <button
                            onClick={() => handleDeleteRepo(r.id, r.repoName)}
                            disabled={deletingRepo === r.id}
                            className="p-1.5 rounded hover:bg-red-50 text-surface-400 hover:text-red-650 transition-smooth cursor-pointer"
                            title="Remove project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* GitHub Webhook Setup Guide */}
          <Card className="border border-surface-200/80">
            <CardHeader className="border-b border-surface-100 flex-row items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-50 border border-surface-200/60 flex items-center justify-center text-surface-700">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle>GitHub Webhook Integration</CardTitle>
                  <CardDescription>Setup failure callbacks to push notifications instantly</CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowWebhookGuide(!showWebhookGuide)}
              >
                {showWebhookGuide ? 'Hide Instructions' : 'Show Instructions'}
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              
              {showWebhookGuide && (
                <div className="p-5 bg-surface-50 border border-surface-200 rounded-lg text-xs space-y-4">
                  <h4 className="font-bold text-surface-900">📖 Webhook Installation Instructions</h4>
                  <ol className="list-decimal pl-4 space-y-2.5 text-surface-650 font-medium">
                    <li>
                      Navigate to your GitHub repository &rarr; <strong>Settings</strong> &rarr; <strong>Webhooks</strong> &rarr; Click <strong>Add Webhook</strong>.
                    </li>
                    <li>
                      Paste the payload URL supplied below.
                    </li>
                    <li>
                      Select Content type as <code className="px-1.5 py-0.5 bg-white border border-surface-200 rounded font-mono text-[10px]">application/json</code>.
                    </li>
                    <li>
                      Insert the Webhook Secret key (set in your server's database/env variables).
                    </li>
                    <li>
                      Under "Which events would you like to trigger this webhook?", select <strong>Let me select individual events</strong>. Choose <strong>Workflow runs</strong>.
                    </li>
                    <li>
                      Save the settings. GitHub will ping the payload verification endpoint.
                    </li>
                  </ol>
                </div>
              )}

              <div className="space-y-4">
                {/* Payload URL Copy Field */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider block">Payload URL</span>
                  <div className="flex items-center gap-2 bg-surface-50 border border-surface-200 rounded-lg p-2.5">
                    <code className="flex-1 text-[11px] font-mono text-surface-800 truncate pr-3 select-all">
                      {webhookUrl}
                    </code>
                    <button
                      onClick={handleCopyWebhook}
                      className="p-1.5 bg-white border border-surface-200 rounded-md hover:bg-surface-50 text-surface-500 hover:text-surface-800 transition-smooth flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                    >
                      {copiedWebhook ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy URL</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Configurations grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider block">Content Type</span>
                    <div className="px-3.5 py-2 bg-surface-50 border border-surface-200 rounded-lg">
                      <code className="text-xs font-mono text-surface-700">application/json</code>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider block">Secret Key</span>
                    <div className="px-3.5 py-2 bg-surface-50 border border-surface-200 rounded-lg">
                      <code className="text-xs font-mono text-surface-700">{webhookSecret}</code>
                    </div>
                  </div>
                </div>

                {/* Webhook Warning alert */}
                <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-medium text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Required event permission:</span> Only the <strong>Workflow runs</strong> webhook callback trigger is monitored. Activating general pushes or releases may trigger unnecessary endpoint parsing load.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Global Automation Setup */}
          <Card className="border border-surface-200/80">
            <CardHeader className="border-b border-surface-100 flex-row items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-50 border border-surface-200/60 flex items-center justify-center text-surface-700">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <CardTitle>Automation Settings</CardTitle>
                <CardDescription>Set global presets for self-healing runs</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-between p-4 bg-surface-50 border border-surface-200 rounded-lg">
                <div className="space-y-0.5 max-w-lg">
                  <h4 className="text-xs font-bold text-surface-900">Auto PR Proposal Creation</h4>
                  <p className="text-[11px] text-surface-450 leading-relaxed font-semibold">
                    Automatically compile code patches, stage commits, and open pull requests when AI validation approvals clear.
                  </p>
                </div>
                <button
                  onClick={handleToggleAutoPr}
                  className="text-surface-500 hover:text-surface-900 transition-smooth cursor-pointer"
                  title={session.autoPrEnabled ? "Disable auto PR" : "Enable auto PR"}
                >
                  {session.autoPrEnabled ? (
                    <ToggleRight className="w-8 h-8 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-surface-400" />
                  )}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border border-red-200 bg-red-50/10">
            <CardHeader className="border-b border-red-100">
              <CardTitle className="text-red-800 text-sm font-bold uppercase tracking-wider">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 border border-surface-200 rounded-lg bg-white space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-surface-950 flex items-center gap-1.5">
                    <FileJson className="w-4 h-4 text-surface-600" />
                    Export Local Data
                  </h4>
                  <p className="text-[11px] text-surface-450 mt-1 font-medium">Download current workspace sessions and cached incident feed traces to a JSON file.</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full text-xs font-bold tracking-wide"
                  onClick={handleExport}
                >
                  Export JSON
                </Button>
              </div>

              <div className="p-4 border border-red-200 rounded-lg bg-white space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-red-850 flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-red-650" />
                    Reset Space Cache
                  </h4>
                  <p className="text-[11px] text-surface-450 mt-1 font-medium">Deletes all repositories, webhooks, and failure history saved inside your guest session.</p>
                </div>
                <Button 
                  variant="danger" 
                  size="sm"
                  className="w-full text-xs font-bold tracking-wide"
                  onClick={handleReset}
                >
                  Reset Space
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </main>
  );
}
