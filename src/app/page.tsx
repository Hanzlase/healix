import Link from 'next/link';
import { ArrowRight, Webhook, ShieldCheck, Zap, RefreshCw, GitPullRequest, Search, FileText, Check, CheckCircle2, Cpu, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-surface-900 font-sans selection:bg-brand-100 selection:text-brand-700">
      {/* Premium Glassmorphic Header */}
      <nav className="fixed top-0 w-full glass-panel border-b border-surface-200/60 z-50 transition-smooth">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shadow-sm glow-brand">
              <RefreshCw className="w-4 h-4 text-white animate-spin-[20s]" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-surface-900">Healix</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-xs font-bold text-surface-500 tracking-wider uppercase">
            <Link href="#features" className="hover:text-brand-600 transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-brand-600 transition-colors">Workflow</Link>
            <Link href="/dashboard" className="hover:text-brand-600 transition-colors">Enterprise</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-xs font-bold text-surface-600 hover:text-surface-900 transition-colors tracking-wider uppercase px-3 py-2">
              Sign In
            </Link>
            <Link href="/dashboard" className="px-4 py-2 bg-surface-900 text-white rounded-lg text-xs font-bold hover:bg-surface-800 active:scale-95 transition-smooth shadow-sm uppercase tracking-wider">
              Launch Console
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-36 pb-24 px-6 overflow-hidden">
        {/* Subtle grid background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 -z-10" />
        
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-50 rounded-full border border-brand-200/60 text-brand-700 text-xs font-bold uppercase tracking-wider mb-8 glow-subtle">
            <Sparkles className="w-3.5 h-3.5 text-brand-600 animate-pulse" />
            <span>Autonomous Self-Healing Engine Live</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-surface-900 mb-6 leading-tight">
            CI/CD that <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600">heals itself.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-surface-500 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
            Healix intercepts pipeline failures, diagnoses errors, compiles minimal diff patches, and opens a fully validated pull request—instantly.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard" className="group w-full sm:w-auto px-6 py-3.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-smooth shadow-md hover:shadow-lg flex items-center justify-center gap-2 uppercase tracking-wider active:scale-98">
              Connect GitHub
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/dashboard" className="w-full sm:w-auto px-6 py-3.5 bg-white border border-surface-200 text-surface-700 rounded-xl text-sm font-bold hover:bg-surface-50 transition-smooth shadow-sm flex items-center justify-center gap-2 uppercase tracking-wider active:scale-98">
              Explore Demo
            </Link>
          </div>
          
          {/* Visual Showcase */}
          <div className="mt-20 relative max-w-4xl mx-auto">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-brand-500/20 via-indigo-500/20 to-emerald-500/20 rounded-2xl -z-10 blur-md" />
            <div className="bg-white rounded-xl border border-surface-200 shadow-2xl overflow-hidden p-1.5">
              <div className="bg-surface-900 rounded-lg border border-surface-800 overflow-hidden text-left font-mono">
                {/* Window chrome bar */}
                <div className="bg-surface-800/80 px-4 py-3 flex items-center justify-between border-b border-surface-800">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"/>
                    <div className="w-3 h-3 rounded-full bg-amber-500/80"/>
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80"/>
                  </div>
                  <span className="text-[10px] text-surface-400 font-semibold uppercase tracking-wider">healix-console // pipeline-logs</span>
                  <div className="w-12" />
                </div>
                {/* Simulated Pipeline Log Trace */}
                <div className="p-5 text-[11px] space-y-4">
                  <div className="flex items-center gap-3 border-b border-surface-800 pb-3">
                    <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/20 rounded font-bold uppercase text-[9px] tracking-wider">Failed</span>
                    <span className="text-surface-400 text-[10px]">CI run #3829 on main — build:test</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-center text-[10px] py-1">
                    {[
                      { step: 'Detect', status: 'Passed', color: 'text-emerald-400 border-emerald-900/40 bg-emerald-950/20' },
                      { step: 'Analyze', status: 'Passed', color: 'text-emerald-400 border-emerald-900/40 bg-emerald-950/20' },
                      { step: 'Patch', status: 'Passed', color: 'text-emerald-400 border-emerald-900/40 bg-emerald-950/20' },
                      { step: 'Review', status: 'Passed', color: 'text-emerald-400 border-emerald-900/40 bg-emerald-950/20' },
                      { step: 'PR Open', status: 'Passed', color: 'text-emerald-400 border-emerald-900/40 bg-emerald-950/20' }
                    ].map((s, idx) => (
                      <div key={idx} className={`border rounded-lg p-2 ${s.color} flex flex-col items-center gap-1`}>
                        <div className="font-bold uppercase tracking-wider text-white mb-0.5">{s.step}</div>
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                          <Check className="w-3 h-3" />
                          <span>{s.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-surface-950 rounded-lg p-4 border border-surface-800 space-y-1 overflow-x-auto">
                    <div className="text-surface-500 text-[10px] pb-1">@@ -12,7 +12,7 @@ async function authenticate()</div>
                    <div className="text-red-400 bg-red-950/25 px-2 rounded py-0.5">- await auth.login(user)</div>
                    <div className="text-emerald-400 bg-emerald-950/30 px-2 rounded py-0.5">+ await auth.signIn({'{ provider: \'github\' }'})</div>
                    <div className="text-surface-400 px-2">  return session</div>
                  </div>

                  <div className="flex items-center justify-between bg-emerald-950/30 border border-emerald-800/40 rounded-lg px-4 py-3 text-[11px]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center text-white">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-emerald-400 font-semibold">PR #107 opened — healix/fix-auth-handler</span>
                    </div>
                    <Link href="/dashboard" className="text-emerald-300 hover:text-emerald-200 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <span>View Trace</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="py-24 px-6 border-t border-surface-200/50 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">Designed for background precision.</h2>
            <p className="text-surface-500 font-medium max-w-xl mx-auto text-sm leading-relaxed">
              Every layer of the pipeline is crafted to diagnose build failures with surgical accuracy and minimal overhead.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Webhook className="w-5 h-5 text-brand-600" />}
              title="Real-time Webhook Hooks"
              description="Sub-second reaction to GitHub workflow failures. Listens directly to repo events and initiates diagnoses immediately."
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
              title="Multi-Agent Validation"
              description="A systematic code-review layer parses generated patches. Ensures only safe, compiling, and minimal changes are promoted."
            />
            <FeatureCard 
              icon={<Zap className="w-5 h-5 text-amber-600" />}
              title="Mean-Time-To-Recovery (MTTR)"
              description="Shave hours of debugging down to seconds. Automatically opens PRs on isolated fix branches for quick human approval."
            />
          </div>
        </div>
      </section>

      {/* Workflow Loop */}
      <section id="how-it-works" className="py-24 px-6 bg-[#F8FAFC] border-t border-surface-200/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-8">The Self-Healing Loop</h2>
              <div className="space-y-8">
                <WorkflowStep 
                  number="01" 
                  title="Detect failures" 
                  description="Healix listens to your repository. When a CI run fails, we capture the logs, error reports, and stack traces instantly." 
                />
                <WorkflowStep 
                  number="02" 
                  title="Analyze & generate patch" 
                  description="Our parser isolates the root cause from the noise. The patch generation engine creates a surgical fix solving the error without bloat." 
                />
                <WorkflowStep 
                  number="03" 
                  title="Review & open PR" 
                  description="A dedicated validation step audits the patch. If safe, a pull request is automatically opened on a new branch." 
                />
              </div>
            </div>
            <div className="bg-white rounded-xl p-8 border border-surface-200/80 shadow-sm flex flex-col justify-center gap-6">
              <div className="flex items-center gap-2 border-b border-surface-100 pb-4">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span className="text-xs text-surface-500 font-bold uppercase tracking-wider">Simulation Run Trace</span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-brand-50 rounded-full flex items-center justify-center text-brand-600 text-xs font-bold">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-xs font-semibold text-surface-700">Analyzed stack trace: resolved auth exception</span>
                </div>
                <div className="bg-emerald-50/80 border border-emerald-200/60 rounded-xl p-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <GitPullRequest className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-900">Auto-fix patch verified</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md uppercase tracking-wider">Ready</span>
                </div>
                <div className="h-3 bg-surface-100 rounded-full w-full"></div>
                <div className="h-3 bg-surface-100 rounded-full w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clean Footer */}
      <footer className="py-16 bg-white border-t border-surface-200/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 bg-surface-900 rounded-lg flex items-center justify-center">
                  <RefreshCw className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-lg font-bold tracking-tight text-surface-900">Healix</span>
              </div>
              <p className="max-w-xs text-xs text-surface-400 leading-relaxed font-medium">
                Autonomous self-healing pipeline integrations for high-velocity software engineering teams.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
               <FooterCol title="Product" links={['Features', 'Dashboard', 'Changelog']} />
               <FooterCol title="Company" links={['About', 'Security', 'Contact']} />
               <FooterCol title="Legal" links={['Privacy', 'Terms', 'License']} />
            </div>
          </div>
          <div className="border-t border-surface-100 pt-8 flex justify-between items-center text-[10px] font-bold text-surface-400 uppercase tracking-widest">
            <span>© 2026 Healix Corp</span>
            <div className="flex gap-6">
              <a href="#" className="hover:text-brand-600 transition-colors">Twitter</a>
              <a href="#" className="hover:text-brand-600 transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-8 bg-[#F8FAFC] rounded-xl border border-surface-200/60 transition-smooth hover:bg-white hover:border-surface-200 hover:shadow-md group">
      <div className="w-10 h-10 rounded-lg bg-white border border-surface-200 flex items-center justify-center mb-6 shadow-sm group-hover:border-brand-100 group-hover:bg-brand-50/20 transition-smooth">
        {icon}
      </div>
      <h3 className="text-lg font-bold tracking-tight text-surface-900 mb-2">{title}</h3>
      <p className="text-xs text-surface-500 font-medium leading-relaxed">{description}</p>
    </div>
  );
}

function WorkflowStep({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-4 group">
      <div className="text-2xl font-bold text-surface-300 font-mono group-hover:text-brand-600 transition-colors">{number}</div>
      <div className="space-y-1">
        <h4 className="text-base font-bold text-surface-950 tracking-tight group-hover:text-brand-600 transition-colors">{title}</h4>
        <p className="text-xs text-surface-500 font-medium leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div className="space-y-4">
      <h5 className="text-[10px] font-bold text-surface-900 uppercase tracking-widest">{title}</h5>
      <ul className="space-y-2.5">
        {links.map(l => (
          <li key={l}>
            <Link href="#" className="text-xs font-semibold text-surface-400 hover:text-surface-800 transition-colors">{l}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
