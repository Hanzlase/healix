'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  Webhook, 
  ShieldCheck, 
  GitPullRequest, 
  Check, 
  CheckCircle2, 
  Cpu, 
  FlaskConical,
  Layers,
  Radio
} from 'lucide-react';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'failure' | 'patch'>('patch');

  return (
    <div className="min-h-screen bg-[#F5F4EF] text-[#20221F] font-sans flex flex-col selection:bg-[#D65A31] selection:text-white">
      {/* Navigation Header */}
      <nav className="fixed top-0 w-full bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#DDDFD7] z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-[#20221F] flex items-center justify-center text-white font-bold text-xs shadow-2xs">
                <span className="text-[#D65A31] font-mono font-black">H</span>
              </div>
              <span className="text-sm font-bold tracking-tight text-[#20221F] flex items-center gap-1.5">
                Healix <span className="text-[10px] font-mono font-medium text-[#696D65] bg-[#ECEDE7] border border-[#DDDFD7] px-1.5 py-0.2 rounded">v2.0</span>
              </span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center gap-6 text-xs font-mono text-[#696D65]">
            <Link href="#pipeline" className="hover:text-[#20221F] transition-colors">Pipeline</Link>
            <Link href="#features" className="hover:text-[#20221F] transition-colors">Architecture</Link>
            <Link href="#comparison" className="hover:text-[#20221F] transition-colors">Comparison</Link>
            <Link href="#safety" className="hover:text-[#20221F] transition-colors">Safety Guardrails</Link>
          </div>

          <div className="flex items-center gap-2.5">
            <Link 
              href="/signin" 
              className="text-xs font-mono font-medium text-[#696D65] hover:text-[#20221F] px-2.5 py-1.5"
            >
              Sign In
            </Link>
            <Link 
              href="/dashboard" 
              className="px-3 py-1.5 bg-[#D65A31] hover:bg-[#B94A28] text-white rounded-md text-xs font-medium transition-subtle flex items-center gap-1 shadow-2xs"
            >
              <span>Live Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-28 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-5">
          
          {/* Release Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ECEDE7] border border-[#DDDFD7] text-[#20221F] text-xs font-mono">
            <Radio className="w-3 h-3 text-[#26764F]" />
            <span>Autonomous CI/CD Remediation Engine</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-[#20221F] leading-tight">
            Your failed builds shouldn&apos;t <br className="hidden sm:inline" />
            <span className="text-[#D65A31]">wait for a developer.</span>
          </h1>

          {/* Supporting Pitch */}
          <p className="text-sm md:text-base text-[#696D65] max-w-2xl mx-auto leading-relaxed">
            When CI breaks, Healix intercepts the workflow failure, investigates the trace logs, synthesizes a targeted code patch, audits remediation safety, and opens a fix Pull Request.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link 
              href="/dashboard" 
              className="w-full sm:w-auto px-5 py-2.5 bg-[#D65A31] hover:bg-[#B94A28] text-white rounded-md text-xs font-mono font-semibold transition-subtle flex items-center justify-center gap-2 shadow-2xs"
            >
              <span>Launch Live Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link 
              href="/dashboard/settings" 
              className="w-full sm:w-auto px-5 py-2.5 bg-[#FFFFFF] border border-[#DDDFD7] hover:border-[#C4C7BE] hover:bg-[#F5F4EF] text-[#20221F] rounded-md text-xs font-mono font-semibold transition-subtle flex items-center justify-center gap-2"
            >
              <span>Connect Repository</span>
            </Link>
          </div>

          {/* Interactive Hero Console Preview */}
          <div className="mt-10 max-w-3xl mx-auto text-left">
            <div className="bg-[#191B19] border border-[#353934] rounded-lg shadow-xl overflow-hidden text-[#E8E9E3]">
              
              {/* Terminal Window Header */}
              <div className="bg-[#222522] px-4 py-2.5 border-b border-[#353934] flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E58C85]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E7D8BA]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#83C995]" />
                  <span className="text-xs font-mono text-[#A0A49B] ml-2">
                    healix-agent // incident-remediation
                  </span>
                </div>

                <div className="flex items-center bg-[#191B19] rounded p-0.5 border border-[#353934] text-[11px] font-mono">
                  <button
                    onClick={() => setActiveTab('failure')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      activeTab === 'failure' ? 'bg-[#353934] text-white font-semibold' : 'text-[#A0A49B] hover:text-[#E8E9E3]'
                    }`}
                  >
                    1. CI Failure Event
                  </button>
                  <button
                    onClick={() => setActiveTab('patch')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      activeTab === 'patch' ? 'bg-[#353934] text-white font-semibold' : 'text-[#A0A49B] hover:text-[#E8E9E3]'
                    }`}
                  >
                    2. Synthesized Fix (PR #108)
                  </button>
                </div>
              </div>

              {/* Stepper Status Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-3 bg-[#191B19] border-b border-[#353934] text-[10px] font-mono">
                {[
                  { step: 'Ingest Webhook', status: 'Passed', dur: '42ms' },
                  { step: 'Gemini Root Cause', status: 'Passed', dur: '810ms' },
                  { step: 'Patch Synthesis', status: 'Passed', dur: '520ms' },
                  { step: 'Safety Review', status: 'Approved', dur: '310ms' },
                  { step: 'Auto PR Staged', status: 'PR #108', dur: '210ms' },
                ].map((s, idx) => (
                  <div key={idx} className="p-2 rounded bg-[#222522] border border-[#353934] flex flex-col gap-0.5">
                    <span className="text-[#A0A49B] uppercase font-semibold">{s.step}</span>
                    <div className="flex items-center justify-between text-[#83C995] font-semibold">
                      <span className="flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>{s.status}</span>
                      </span>
                      <span className="text-[9px] text-[#A0A49B]">{s.dur}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Code Preview Content */}
              <div className="p-4 font-mono text-xs overflow-x-auto bg-[#191B19] leading-relaxed">
                {activeTab === 'failure' ? (
                  <div className="space-y-1.5 text-[#E8E9E3]">
                    <div className="text-[#E58C85] font-semibold">[CI:FAIL] Run #3928 on branch fix/auth-provider</div>
                    <div className="text-[#A0A49B]">FAIL src/lib/auth.test.ts</div>
                    <div className="text-[#E58C85] bg-[#E58C85]/10 p-2.5 rounded border border-[#E58C85]/30 mt-2">
                      TypeError: Cannot read properties of undefined (reading &apos;sessionToken&apos;)
                      <br />
                      &nbsp;&nbsp;at Object.validateSession (src/lib/auth.ts:42:19)
                    </div>
                    <div className="text-[#A0A49B] pt-1 text-[11px]">
                      &gt; Process exited with code 1. Intercepted by Healix webhook listener.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-[#A0A49B] text-[11px] pb-1">@@ -40,4 +40,4 @@ src/lib/auth.ts</div>
                    <div className="text-[#A0A49B]">&nbsp;export async function validateSession(req: Request) &#123;</div>
                    <div className="text-[#A0A49B]">&nbsp;&nbsp;&nbsp;const session = await getSession(req);</div>
                    <div className="bg-[rgba(229,140,133,0.12)] text-[#E58C85] px-2 py-0.5 rounded border-l-2 border-[#E58C85]">
                      - const token = session.user.sessionToken;
                    </div>
                    <div className="bg-[rgba(131,201,149,0.12)] text-[#83C995] font-semibold px-2 py-0.5 rounded border-l-2 border-[#83C995]">
                      + const token = session?.user?.sessionToken;
                    </div>
                    <div className="text-[#A0A49B]">&nbsp;&nbsp;&nbsp;if (!token) throw new AuthError(&apos;Missing token&apos;);</div>

                    <div className="mt-4 p-2.5 rounded bg-[#222522] border border-[#353934] flex items-center justify-between flex-wrap gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-[#83C995] font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Safety Reviewer: Approved (Low Risk) &bull; Auto PR Opened</span>
                      </div>
                      <Link
                        href="/dashboard"
                        className="text-[11px] text-[#D65A31] hover:underline font-semibold flex items-center gap-1"
                      >
                        <span>Open in Console</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pipeline Explanation Section */}
      <section id="pipeline" className="py-16 px-6 border-t border-[#DDDFD7] bg-[#FFFFFF]">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <span className="text-[11px] font-mono font-bold text-[#D65A31] uppercase tracking-wider">
              Remediation Lifecycle
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-[#20221F] tracking-tight">
              Five Stages of Autonomous Recovery
            </h2>
            <p className="text-xs text-[#696D65] max-w-xl mx-auto font-mono">
              From the instant a GitHub Action fails to the moment a tested Pull Request is ready for merge.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {[
              { num: '01', title: 'Ingest Webhook', desc: 'Captures GitHub workflow_run failure payload and pulls raw job execution logs.' },
              { num: '02', title: 'Root Cause', desc: 'Gemini parses error traces, isolating the specific file, stack frame, and failure mode.' },
              { num: '03', title: 'Patch Synthesis', desc: 'Generates a minimal, targeted unified code diff addressing the verified fault.' },
              { num: '04', title: 'Safety Review', desc: 'Audits patch scope to prevent regressions, unexpected deletions, or security flaws.' },
              { num: '05', title: 'PR Dispatch', desc: 'Stages a dedicated fix branch on GitHub and opens a Pull Request with complete context.' },
            ].map((step, idx) => (
              <div key={idx} className="p-4 bg-[#F5F4EF] border border-[#DDDFD7] rounded-md space-y-2">
                <span className="font-mono text-xs font-bold text-[#D65A31]">{step.num}</span>
                <h3 className="text-xs font-semibold text-[#20221F]">{step.title}</h3>
                <p className="text-[11px] text-[#696D65] leading-normal font-mono">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Architecture Section */}
      <section id="features" className="py-16 px-6 border-t border-[#DDDFD7] bg-[#F5F4EF]">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <span className="text-[11px] font-mono font-bold text-[#D65A31] uppercase tracking-wider">
              System Capabilities
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-[#20221F] tracking-tight">
              Built for Engineering Reliability
            </h2>
            <p className="text-xs text-[#696D65] font-mono max-w-lg mx-auto">
              Every remediation action is scoped, auditable, and subject to guardrails.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FeatureCard
              icon={<Webhook className="w-4 h-4 text-[#D65A31]" />}
              title="Webhook Ingestion Engine"
              desc="Sub-second reaction to GitHub workflow failures. Automatically extracts job logs, stack traces, and commit diffs."
            />
            <FeatureCard
              icon={<Cpu className="w-4 h-4 text-[#20221F]" />}
              title="Deterministic Diagnosis"
              desc="Gemini log parsing isolates precise syntax errors, type drifts, and broken dependencies with confidence scores."
            />
            <FeatureCard
              icon={<ShieldCheck className="w-4 h-4 text-[#26764F]" />}
              title="Automated Safety Review"
              desc="Independent validator audits patch risk, flagging out-of-scope changes or potential regressions before PR dispatch."
            />
            <FeatureCard
              icon={<GitPullRequest className="w-4 h-4 text-[#D65A31]" />}
              title="Clean Pull Request Staging"
              desc="Creates scoped fix branches with complete root cause descriptions, commands to run, and commit hashes."
            />
            <FeatureCard
              icon={<Layers className="w-4 h-4 text-[#20221F]" />}
              title="Multi-Repository Monitoring"
              desc="Monitor multiple projects simultaneously with per-repository auto-PR toggles and centralized telemetry."
            />
            <FeatureCard
              icon={<FlaskConical className="w-4 h-4 text-[#D65A31]" />}
              title="Built-in Test Harness"
              desc="Simulate TypeScript errors, Prisma schema drift, or missing package incidents on demand to verify pipelines."
            />
          </div>
        </div>
      </section>

      {/* Comparison Matrix */}
      <section id="comparison" className="py-16 px-6 border-t border-[#DDDFD7] bg-[#FFFFFF]">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-[11px] font-mono font-bold text-[#D65A31] uppercase tracking-wider">
              Operational Impact
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-[#20221F] tracking-tight">
              Manual Debugging vs. Healix
            </h2>
          </div>

          <div className="bg-[#FFFFFF] border border-[#DDDFD7] rounded-lg overflow-hidden shadow-2xs">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[#F5F4EF] border-b border-[#DDDFD7] text-[#696D65] uppercase text-[11px]">
                <tr>
                  <th className="p-3.5 pl-5">Workflow Step</th>
                  <th className="p-3.5 text-[#B83D38]">Traditional Manual Process</th>
                  <th className="p-3.5 text-[#26764F]">Healix Autonomous Engine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDDFD7] text-[#20221F]">
                <tr>
                  <td className="p-3.5 pl-5 font-semibold">Failure Notification</td>
                  <td className="p-3.5 text-[#696D65]">Slack ping or email (human checks hours later)</td>
                  <td className="p-3.5 text-[#26764F] font-semibold">Immediate Webhook trigger (0.04s)</td>
                </tr>
                <tr>
                  <td className="p-3.5 pl-5 font-semibold">Log Analysis & Root Cause</td>
                  <td className="p-3.5 text-[#696D65]">Manually digging through raw terminal output</td>
                  <td className="p-3.5 text-[#26764F] font-semibold">Gemini isolates exact fault location (&lt;1s)</td>
                </tr>
                <tr>
                  <td className="p-3.5 pl-5 font-semibold">Code Patch Generation</td>
                  <td className="p-3.5 text-[#696D65]">Manual clone, local repro, hand-written edits</td>
                  <td className="p-3.5 text-[#26764F] font-semibold">Synthesized unified diff (&lt;1s)</td>
                </tr>
                <tr>
                  <td className="p-3.5 pl-5 font-semibold">Safety & Scope Audit</td>
                  <td className="p-3.5 text-[#696D65]">Queued for teammate code review</td>
                  <td className="p-3.5 text-[#26764F] font-semibold">Automated risk & regression safety audit</td>
                </tr>
                <tr>
                  <td className="p-3.5 pl-5 font-semibold">Pull Request Dispatch</td>
                  <td className="p-3.5 text-[#696D65]">Manual branch creation and PR submission</td>
                  <td className="p-3.5 text-[#26764F] font-semibold">Auto-staged PR with explanation</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Trust & Safety Guardrails */}
      <section id="safety" className="py-16 px-6 border-t border-[#DDDFD7] bg-[#F5F4EF]">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <span className="text-[11px] font-mono font-bold text-[#D65A31] uppercase tracking-wider">
              Safety & Controls
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-[#20221F] tracking-tight">
              Predictable, Non-Destructive Guardrails
            </h2>
            <p className="text-xs text-[#696D65] font-mono max-w-lg mx-auto">
              Healix will never merge code or push directly to protected branches.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-[#FFFFFF] border border-[#DDDFD7] rounded-md space-y-1.5">
              <h4 className="text-xs font-semibold text-[#20221F]">Branch Isolation</h4>
              <p className="text-[11px] text-[#696D65] font-mono leading-normal">
                Patches are opened on dedicated <code className="text-[#20221F]">healix/*</code> branches. Main and production branches remain untouched.
              </p>
            </div>
            <div className="p-4 bg-[#FFFFFF] border border-[#DDDFD7] rounded-md space-y-1.5">
              <h4 className="text-xs font-semibold text-[#20221F]">Human in the Loop</h4>
              <p className="text-[11px] text-[#696D65] font-mono leading-normal">
                Fixes are submitted as reviewable Pull Requests. Your team retains ultimate authority to review and merge.
              </p>
            </div>
            <div className="p-4 bg-[#FFFFFF] border border-[#DDDFD7] rounded-md space-y-1.5">
              <h4 className="text-xs font-semibold text-[#20221F]">Automated Scope Limits</h4>
              <p className="text-[11px] text-[#696D65] font-mono leading-normal">
                The safety validator rejects patches that touch unrelated files, modify credentials, or introduce broad changes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 px-6 border-t border-[#DDDFD7] bg-[#FFFFFF]">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold text-[#20221F] tracking-tight">
            Ready to Automate Pipeline Recovery?
          </h2>
          <p className="text-xs text-[#696D65] font-mono max-w-md mx-auto leading-normal">
            Launch the live console or connect a repository in minutes to start healing CI/CD failures.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-[#D65A31] hover:bg-[#B94A28] text-white rounded-md text-xs font-mono font-semibold transition-subtle inline-flex items-center gap-2 shadow-2xs"
            >
              <span>Launch Live Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-[#DDDFD7] bg-[#F5F4EF] text-[#696D65] text-xs font-mono">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#20221F] flex items-center justify-center text-white font-bold text-[10px]">
              <span className="text-[#D65A31]">H</span>
            </div>
            <span className="font-semibold text-[#20221F]">Healix Autonomous CI/CD Remediation</span>
          </div>
          <div>
            <span>&copy; 2026 Healix. Designed for engineering and DevOps teams.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="p-4 bg-[#FFFFFF] border border-[#DDDFD7] rounded-md space-y-2 shadow-2xs">
      <div className="w-7 h-7 rounded bg-[#F5F4EF] border border-[#DDDFD7] flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-xs font-semibold text-[#20221F]">{title}</h3>
      <p className="text-[11px] text-[#696D65] font-mono leading-normal">{desc}</p>
    </div>
  );
}
