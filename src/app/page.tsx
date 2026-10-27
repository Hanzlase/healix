'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  Webhook, 
  ShieldCheck, 
  Zap, 
  RefreshCw, 
  GitPullRequest, 
  Search, 
  FileText, 
  Check, 
  CheckCircle2, 
  Cpu, 
  Sparkles,
  GitBranch,
  Terminal,
  Activity,
  Layers,
  Code2,
  Lock,
  ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'failure' | 'patch'>('patch');

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white flex flex-col">
      {/* Glow Ambient Lights */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-600/20 via-cyan-500/10 to-transparent blur-[120px] pointer-events-none -z-10" />

      {/* Navigation Header */}
      <nav className="fixed top-0 w-full bg-slate-950/70 backdrop-blur-xl border-b border-slate-800/80 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <RefreshCw className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              Healix <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/15 border border-indigo-500/30 px-1.5 py-0.5 rounded">v2.0</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            <Link href="#features" className="hover:text-indigo-400 transition-colors">Features</Link>
            <Link href="#workflow" className="hover:text-indigo-400 transition-colors">Pipeline</Link>
            <Link href="#comparison" className="hover:text-indigo-400 transition-colors">Why Healix</Link>
            <Link href="/dashboard" className="hover:text-indigo-400 transition-colors">Live Console</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              href="/signin" 
              className="text-xs font-mono font-bold text-slate-400 hover:text-white transition-colors px-3 py-2"
            >
              Sign In
            </Link>
            <Link 
              href="/dashboard" 
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-indigo-600/25 flex items-center gap-1.5"
            >
              <span>Launch Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-36 pb-20 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          
          {/* Release Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>Autonomous CI/CD Failure Detection & Auto-Healing</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white leading-tight">
            CI/CD Pipelines That <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400">
              Heal Themselves.
            </span>
          </h1>

          {/* Supporting Pitch */}
          <p className="text-base md:text-xl text-slate-400 max-w-2xl mx-auto font-mono leading-relaxed">
            Healix intercepts broken builds, diagnoses root causes with Gemini AI, synthesizes minimal code fixes with GPT-OSS-120B, and automatically stages tested Pull Requests.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link 
              href="/dashboard" 
              className="w-full sm:w-auto px-7 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-mono font-bold transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 group uppercase tracking-wider"
            >
              <span>Launch Live Console</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/dashboard/settings" 
              className="w-full sm:w-auto px-7 py-3.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              <span>Connect Repository</span>
            </Link>
          </div>

          {/* Interactive Hero Console Preview */}
          <div className="mt-14 max-w-4xl mx-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-left">
              
              {/* Terminal Window Header */}
              <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-xs font-mono font-bold text-slate-400 ml-2">
                    healix-orchestrator // pipeline-telemetry
                  </span>
                </div>

                <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-xs font-mono font-bold">
                  <button
                    onClick={() => setActiveTab('failure')}
                    className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                      activeTab === 'failure' ? 'bg-red-500/20 text-red-300' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    1. Failure Event
                  </button>
                  <button
                    onClick={() => setActiveTab('patch')}
                    className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                      activeTab === 'patch' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    2. AI Healed Fix (PR #108)
                  </button>
                </div>
              </div>

              {/* Stepper Status Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-4 bg-slate-950/60 border-b border-slate-800 text-[10px] font-mono">
                {[
                  { step: 'Ingest Webhook', status: 'Passed', dur: '42ms' },
                  { step: 'Gemini Diagnosis', status: 'Passed', dur: '810ms' },
                  { step: 'GPT-OSS Patch', status: 'Passed', dur: '520ms' },
                  { step: 'Safety Review', status: 'Approved', dur: '310ms' },
                  { step: 'Auto PR Opened', status: 'PR #108', dur: '210ms' },
                ].map((s, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col gap-0.5">
                    <span className="font-bold text-slate-400 uppercase">{s.step}</span>
                    <div className="flex items-center justify-between text-emerald-400 font-bold">
                      <span className="flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>{s.status}</span>
                      </span>
                      <span className="text-[9px] text-slate-500">{s.dur}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Code Preview Content */}
              <div className="p-5 font-mono text-xs overflow-x-auto bg-slate-950 leading-relaxed">
                {activeTab === 'failure' ? (
                  <div className="space-y-1 text-slate-300">
                    <div className="text-red-400 font-bold">[CI:FAIL] Run #3928 on branch fix/auth-provider</div>
                    <div className="text-slate-500">FAIL src/lib/auth.test.ts</div>
                    <div className="text-red-300 bg-red-950/30 p-2.5 rounded border border-red-900/30 mt-2">
                      TypeError: Cannot read properties of undefined (reading &apos;sessionToken&apos;)
                      <br />
                      &nbsp;&nbsp;at Object.validateSession (src/lib/auth.ts:42:19)
                    </div>
                    <div className="text-slate-500 pt-2 text-[11px]">
                      &gt; Process exited with code 1. Intercepted by Healix GitHub webhook.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-slate-400 text-[11px] pb-1">@@ -40,4 +40,4 @@ src/lib/auth.ts</div>
                    <div className="text-slate-400">&nbsp;export async function validateSession(req: Request) &#123;</div>
                    <div className="text-slate-400">&nbsp;&nbsp;&nbsp;const session = await getSession(req);</div>
                    <div className="bg-red-950/40 text-red-300 px-2 py-0.5 rounded border-l-2 border-red-500">
                      - const token = session.user.sessionToken;
                    </div>
                    <div className="bg-emerald-950/40 text-emerald-300 font-bold px-2 py-0.5 rounded border-l-2 border-emerald-500">
                      + const token = session?.user?.sessionToken;
                    </div>
                    <div className="text-slate-400">&nbsp;&nbsp;&nbsp;if (!token) throw new AuthError(&apos;Missing token&apos;);</div>

                    <div className="mt-4 p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between flex-wrap gap-2 text-xs">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Safety Reviewer Verdict: Approved (Low Risk) &bull; Auto PR Opened</span>
                      </div>
                      <Link
                        href="/dashboard"
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                      >
                        <span>Inspect in Dashboard</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="py-24 px-6 border-t border-slate-800/80 bg-slate-950/40">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-3">
            <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2.5 py-1 rounded border border-indigo-500/20">
              AUTONOMOUS HEALING ARCHITECTURE
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              Surgical Precision at Every Layer
            </h2>
            <p className="text-slate-400 font-mono text-sm max-w-xl mx-auto">
              Healix does not blindly rewrite your codebase. Every patch passes strict multi-agent validation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Webhook className="w-5 h-5 text-indigo-400" />}
              title="Real-Time Webhook Engine"
              desc="Sub-second reaction to GitHub workflow failures. Extracts job logs, stack traces, and commit diffs automatically."
            />
            <FeatureCard
              icon={<Cpu className="w-5 h-5 text-cyan-400" />}
              title="Dual-Model Intelligence"
              desc="Gemini AI performs deep root cause log parsing, while GPT-OSS-120B synthesizes unified diff code repairs."
            />
            <FeatureCard
              icon={<ShieldCheck className="w-5 h-5 text-emerald-400" />}
              title="Strict Safety Reviewer"
              desc="An independent AI validator audits every patch for scope creep, security vulnerabilities, and code safety before PR creation."
            />
            <FeatureCard
              icon={<GitPullRequest className="w-5 h-5 text-amber-400" />}
              title="Autonomous Pull Requests"
              desc="Opens clean fix branches with complete root cause descriptions, test commands, and reviewer explanations."
            />
            <FeatureCard
              icon={<Layers className="w-5 h-5 text-purple-400" />}
              title="Multi-Project & Guest Spaces"
              desc="Manage multiple GitHub repositories simultaneously with per-repo auto-PR toggles and granular telemetry."
            />
            <FeatureCard
              icon={<Sparkles className="w-5 h-5 text-pink-400" />}
              title="On-Demand Incident Simulator"
              desc="Test and benchmark your self-healing pipeline with built-in failure scenarios directly from the dashboard."
            />
          </div>
        </div>
      </section>

      {/* Comparison Matrix */}
      <section id="comparison" className="py-24 px-6 border-t border-slate-800/80">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest bg-cyan-500/10 px-2.5 py-1 rounded border border-cyan-500/20">
              BENCHMARK
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Manual Debugging vs. Healix
            </h2>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                <tr>
                  <th className="p-4 pl-6">Workflow Step</th>
                  <th className="p-4 text-red-400">Traditional CI/CD</th>
                  <th className="p-4 text-emerald-400">Healix Autonomous</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                <tr>
                  <td className="p-4 pl-6 font-bold text-white">Failure Notification</td>
                  <td className="p-4 text-slate-400">Slack ping or email (human checks hours later)</td>
                  <td className="p-4 text-emerald-400 font-bold">Immediate Webhook trigger (0.04s)</td>
                </tr>
                <tr>
                  <td className="p-4 pl-6 font-bold text-white">Log Analysis & Root Cause</td>
                  <td className="p-4 text-slate-400">Digging through 10,000 raw terminal lines</td>
                  <td className="p-4 text-emerald-400 font-bold">Gemini AI isolates precise error (0.8s)</td>
                </tr>
                <tr>
                  <td className="p-4 pl-6 font-bold text-white">Code Patch Synthesis</td>
                  <td className="p-4 text-slate-400">Manual git clone, local repro, hand edits</td>
                  <td className="p-4 text-emerald-400 font-bold">GPT-OSS builds unified diff (0.5s)</td>
                </tr>
                <tr>
                  <td className="p-4 pl-6 font-bold text-white">Security & Safety Audit</td>
                  <td className="p-4 text-slate-400">Manual peer review queue</td>
                  <td className="p-4 text-emerald-400 font-bold">Automated risk & regression audit</td>
                </tr>
                <tr>
                  <td className="p-4 pl-6 font-bold text-white">Pull Request Creation</td>
                  <td className="p-4 text-slate-400">Manual git push and form fill</td>
                  <td className="p-4 text-emerald-400 font-bold">Autonomous GitHub PR staged</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 border-t border-slate-800/80 bg-gradient-to-b from-slate-950/60 to-slate-900">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            Ready to Automate Pipeline Recovery?
          </h2>
          <p className="text-base text-slate-400 font-mono max-w-xl mx-auto leading-relaxed">
            Connect your repository in under 2 minutes. Watch your broken builds repair themselves before your team even notices.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-mono font-bold transition-all shadow-xl shadow-indigo-600/30 inline-flex items-center gap-2 uppercase tracking-wider"
            >
              <span>Launch Live Console Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-800/80 bg-slate-950 text-slate-500 text-xs font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-slate-300">Healix Autonomous Self-Healing CI/CD</span>
          </div>
          <div>
            <span>&copy; 2026 Healix. Built for modern DevOps & engineering teams.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3 hover:border-slate-700 transition-all shadow-lg hover:shadow-indigo-500/5 group">
      <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center group-hover:scale-105 transition-transform">
        {icon}
      </div>
      <h3 className="text-sm font-bold text-slate-100">{title}</h3>
      <p className="text-xs text-slate-400 font-mono leading-relaxed">{desc}</p>
    </div>
  );
}
