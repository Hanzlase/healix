'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { RefreshCw, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        setLoading(false);
      } else {
        const signInRes = await signIn('credentials', { email, password, redirect: false });
        if (signInRes?.error) {
          setError('Account created, but could not sign in automatically.');
          setLoading(false);
        } else {
          router.push('/dashboard');
        }
      }
    } catch {
      setError('An error occurred during sign up.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#070B14] text-slate-100 font-sans flex flex-col md:flex-row selection:bg-indigo-500 selection:text-white">
      {/* Visual Branding Area (Left Panel for Desktop) */}
      <div className="hidden md:flex md:w-1/2 bg-slate-950 text-white flex-col justify-between p-12 relative border-r border-slate-800">
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <RefreshCw className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-black tracking-tight">Healix</span>
        </div>

        <div className="relative z-10 max-w-md space-y-6">
          <div>
            <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              JOIN HEALIX
            </span>
            <h2 className="text-3xl font-black tracking-tight text-white mt-2 leading-tight">
              Turn CI/CD Failures into Merged Pull Requests.
            </h2>
          </div>
          <p className="text-slate-400 text-xs font-mono leading-relaxed">
            Create an account to configure automated repository self-healing, multi-agent patch validation, and analytics telemetry.
          </p>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 font-mono text-[11px] text-slate-300 space-y-2">
            <div className="flex items-center gap-1.5 text-slate-500 pb-2 border-b border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>pipeline:ready // auto-healing active</span>
            </div>
            <p className="text-slate-400">&bull; Gemini AI Root Cause Isolation</p>
            <p className="text-slate-400">&bull; GPT-OSS Minimal Unified Diff Synthesis</p>
            <p className="text-slate-400">&bull; Autonomous Fix PR Generation</p>
          </div>
        </div>

        <div className="relative z-10 text-[11px] font-mono text-slate-500">
          &copy; 2026 Healix Autonomous CI/CD
        </div>
      </div>

      {/* Form Area (Right Panel) */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-sm flex flex-col gap-6">
          <div className="text-center md:text-left flex flex-col items-center md:items-start">
            <div className="md:hidden flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">Healix</span>
            </div>
            
            <h1 className="text-2xl font-black text-white tracking-tight">Create Account</h1>
            <p className="text-xs text-slate-400 mt-1 font-mono">Get started with autonomous healing</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl">
            {/* GitHub OAuth Button */}
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2 h-11 border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-200 text-xs font-mono font-bold"
              onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
            >
              <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
              </svg>
              <span>Sign Up with GitHub</span>
            </Button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">or email</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            {error && (
              <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-400 text-xs font-mono rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleCredentials} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Alex Rivera"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20"
                isLoading={loading}
              >
                Create Account
              </Button>
            </form>
          </div>

          <div className="text-center space-y-2 text-xs font-mono">
            <p className="text-slate-500">
              Already have an account?{' '}
              <Link href="/signin" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4 font-bold">
                Sign In
              </Link>
            </p>
            <p className="text-slate-500 flex items-center justify-center gap-1.5 pt-1">
              <span>Or explore without account:</span>
              <Link href="/dashboard" className="text-slate-300 hover:text-white underline underline-offset-4 inline-flex items-center gap-1 font-bold">
                <span>Continue as Guest</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
