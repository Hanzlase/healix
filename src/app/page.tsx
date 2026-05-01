import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900 font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">Healix</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Sign In
            </Link>
            <Link href="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6">
            Self-healing CI/CD pipelines <br />
            <span className="text-blue-600">powered by AI.</span>
          </h1>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Detect, analyze, and fix failed deployments automatically. 
            Stop wasting hours debugging logs and start merging fixes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard" className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-2xl text-lg font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 hover:-translate-y-0.5">
              Connect GitHub
            </Link>
            <Link href="/dashboard" className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl text-lg font-bold hover:bg-slate-50 transition-all shadow-sm">
              Try without login
            </Link>
          </div>
          
          {/* Dashboard Preview Image Placeholder */}
          <div className="mt-20 relative rounded-3xl overflow-hidden border border-slate-200 shadow-2xl bg-white p-4 group">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-50 to-white/0 opacity-50 pointer-events-none"></div>
            <img 
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2000" 
              alt="Dashboard Preview" 
              className="rounded-2xl w-full object-cover aspect-video"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 backdrop-blur-[2px]">
              <div className="bg-white px-6 py-3 rounded-full shadow-xl font-bold text-blue-600 border border-blue-50">
                View Interactive Demo
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold">Failure Detection</h3>
              <p className="text-slate-600 leading-relaxed">
                Healix listens to your GitHub webhooks and identifies CI failures in real-time before you even notice.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold">AI Root Cause Analysis</h3>
              <p className="text-slate-600 leading-relaxed">
                Leveraging Gemini and GPT-OSS models to parse logs and pinpoint the exact line of code causing the break.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold">Auto PR Fixes</h3>
              <p className="text-slate-600 leading-relaxed">
                Autonomous fix generation and validation. Healix opens the PR for you, complete with a diff and explanation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">How it works</h2>
          <div className="space-y-12">
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold">1</div>
              <div>
                <h4 className="text-xl font-bold mb-2">GitHub failure detected</h4>
                <p className="text-slate-600">As soon as a workflow run fails, Healix receives a webhook and starts the recovery pipeline.</p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold">2</div>
              <div>
                <h4 className="text-xl font-bold mb-2">AI analyzes and fixes</h4>
                <p className="text-slate-600">Our multi-agent system analyzes logs, provides a root cause, and generates a minimal code patch.</p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold">3</div>
              <div>
                <h4 className="text-xl font-bold mb-2">Pull request created automatically</h4>
                <p className="text-slate-600">Once validated, a new branch and PR are created. You just need to review and hit merge.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-slate-50 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h3 className="text-2xl font-bold text-slate-800 mb-4">“Built for developers who hate broken pipelines”</h3>
          <p className="text-slate-500">Join thousands of engineers who use Healix to maintain 100% repository health.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold">Healix</span>
          </div>
          <p className="text-sm text-slate-400">© 2026 Healix AI. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="text-sm text-slate-500 hover:text-slate-900">Privacy</Link>
            <Link href="#" className="text-sm text-slate-500 hover:text-slate-900">Terms</Link>
            <Link href="#" className="text-sm text-slate-500 hover:text-slate-900">GitHub</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
