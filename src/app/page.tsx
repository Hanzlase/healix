import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans">
      {/* Premium Header */}
      <nav className="fixed top-0 w-full bg-white/70 backdrop-blur-xl border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-2xl font-black tracking-tight">Healix</span>
          </div>
          
          <div className="hidden md:flex items-center gap-10 text-sm font-bold text-slate-500 uppercase tracking-widest">
            <Link href="#features" className="hover:text-brand-600 transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-brand-600 transition-colors">Workflow</Link>
            <Link href="/dashboard" className="hover:text-brand-600 transition-colors">Enterprise</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="hidden sm:block text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest">
              Sign In
            </Link>
            <Link href="/dashboard" className="px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-100 hover:-translate-y-0.5 uppercase tracking-widest">
              Launch Console
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-brand-50/50 rounded-[100%] blur-[120px] -z-10 opacity-60"></div>
        
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-50 rounded-full border border-brand-100 text-brand-600 text-xs font-black uppercase tracking-widest mb-10 animate-fade-in">
            <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse"></span>
            Phase 3 Autonomous Engine Live
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tight text-slate-900 mb-8 leading-[0.9] md:leading-[0.9]">
            CI/CD that <br />
            <span className="text-brand-600">heals itself.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-500 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
            Stop debugging broken pipelines manually. Healix detects failures, 
            analyzes logs, and opens a validated Pull Request—before you even get the notification.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/dashboard" className="group w-full sm:w-auto px-10 py-5 bg-brand-600 text-white rounded-2xl text-lg font-black hover:bg-brand-700 transition-all shadow-2xl shadow-brand-100 hover:-translate-y-1 flex items-center justify-center gap-3 uppercase tracking-widest">
              Connect GitHub
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link href="/dashboard" className="w-full sm:w-auto px-10 py-5 bg-white border border-slate-200 text-slate-700 rounded-2xl text-lg font-black hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-3 uppercase tracking-widest">
              Explore Demo
            </Link>
          </div>
          
          {/* Visual Showcase */}
          <div className="mt-24 relative max-w-5xl mx-auto">
            <div className="absolute -inset-4 bg-gradient-to-tr from-brand-100/30 to-slate-100/30 rounded-[40px] -z-10 blur-2xl"></div>
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-2xl overflow-hidden p-3">
              <div className="bg-slate-50 rounded-[22px] border border-slate-100/50 aspect-[16/9] overflow-hidden group relative">
                <img 
                  src="https://images.unsplash.com/photo-1614850523296-e8c1d09e829f?auto=format&fit=crop&q=80&w=2000" 
                  alt="Healix Console" 
                  className="w-full h-full object-cover grayscale opacity-20"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[32px] shadow-2xl border border-white max-w-md text-left">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">AI Agent Verdict</p>
                        <p className="font-bold text-slate-900">Patch Approved & Merged</p>
                      </div>
                    </div>
                    <div className="space-y-3 font-mono text-[10px] text-slate-500">
                      <div className="bg-slate-900 text-slate-400 p-4 rounded-xl">
                        <span className="text-rose-400">- await auth.login()</span><br />
                        <span className="text-emerald-400">+ await auth.signIn({ "{" } provider: 'github' { "}" })</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Engineered for Reliability.</h2>
            <p className="text-slate-500 font-medium text-lg">Every layer of the Healix pipeline is designed to save you time.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>}
              title="Real-time Webhooks"
              description="Instantly reacts to GitHub workflow failures. No polling, no delay. Just immediate action."
              color="blue"
            />
            <FeatureCard 
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>}
              title="AI Validation"
              description="A multi-agent review process ensures that only safe, minimal, and correct fixes are proposed."
              color="emerald"
            />
            <FeatureCard 
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>}
              title="MTTR Reduction"
              description="Reduce Mean Time To Recovery from hours to seconds. Let your team focus on building."
              color="slate"
            />
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="how-it-works" className="py-32 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-10 leading-tight">The 3-Step <br />Self-Healing Loop</h2>
              <div className="space-y-10">
                <WorkflowStep 
                  number="01" 
                  title="Detect" 
                  description="Healix listens to your repository. When a CI run fails, we capture the logs and stack traces instantly." 
                />
                <WorkflowStep 
                  number="02" 
                  title="Analyze & Patch" 
                  description="Gemini identifies the root cause. GPT-OSS-120B generates a surgical fix that solves the issue without bloat." 
                />
                <WorkflowStep 
                  number="03" 
                  title="Verify & PR" 
                  description="Our validator agent checks the fix. If approved, a PR is opened on a new branch automatically." 
                />
              </div>
            </div>
            <div className="bg-slate-50 rounded-[48px] p-12 border border-slate-100 aspect-square flex items-center justify-center relative">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-brand-100)_0%,_transparent_70%)] opacity-30"></div>
               <div className="w-full h-full bg-white rounded-[36px] shadow-2xl border border-slate-100 flex flex-col p-8 overflow-hidden">
                  <div className="flex items-center gap-2 mb-8">
                    <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-4 bg-slate-100 rounded-full w-3/4"></div>
                    <div className="h-4 bg-slate-100 rounded-full w-1/2"></div>
                    <div className="h-32 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center">
                      <span className="text-emerald-600 font-black text-xs uppercase tracking-widest">Patch Generated</span>
                    </div>
                    <div className="h-4 bg-slate-100 rounded-full w-full"></div>
                    <div className="h-4 bg-slate-100 rounded-full w-2/3"></div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-20 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-6 border-t border-slate-200 pt-20">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-20">
            <div>
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-xl font-black tracking-tight">Healix</span>
              </div>
              <p className="max-w-xs text-slate-500 font-medium">Autonomous CI/CD recovery platform for high-performance engineering teams.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-16">
               <FooterCol title="Product" links={['Features', 'Dashboard', 'Changelog']} />
               <FooterCol title="Company" links={['About', 'Security', 'Contact']} />
               <FooterCol title="Legal" links={['Privacy', 'Terms', 'License']} />
            </div>
          </div>
          <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            <span>© 2026 Healix AI Corp</span>
            <div className="flex gap-8">
              <a href="#" className="hover:text-brand-600 transition-colors">Twitter</a>
              <a href="#" className="hover:text-brand-600 transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, color }: { icon: any; title: string; description: string; color: 'blue' | 'emerald' | 'slate' }) {
  const colors = {
    blue: 'bg-brand-50 text-brand-600 border-brand-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    slate: 'bg-slate-100 text-slate-600 border-slate-200'
  };
  
  return (
    <div className="p-10 bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 group">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 border ${colors[color]}`}>
        {icon}
      </div>
      <h3 className="text-2xl font-black tracking-tight mb-4">{title}</h3>
      <p className="text-slate-500 font-medium leading-relaxed">{description}</p>
    </div>
  );
}

function WorkflowStep({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-8 group">
      <div className="text-5xl font-black text-slate-100 group-hover:text-brand-100 transition-colors">{number}</div>
      <div>
        <h4 className="text-2xl font-black mb-2 tracking-tight group-hover:text-brand-600 transition-colors">{title}</h4>
        <p className="text-slate-500 font-medium leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div className="space-y-6">
      <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">{title}</h5>
      <ul className="space-y-4">
        {links.map(l => (
          <li key={l}>
            <Link href="#" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">{l}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
