'use client';

import Link from 'next/link';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await signIn('credentials', { email, password, redirect: false });
    if (res?.error) {
      setError('Invalid email or password.');
      setLoading(false);
    } else {
      window.location.href = '/dashboard';
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row">
      {/* Visual Branding Area (Left Panel for Desktop) */}
      <div className="hidden md:flex md:w-1/2 bg-surface-900 text-white flex-col justify-between p-12 relative border-r border-surface-800">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-20" />
        
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <RefreshCw className="w-4 h-4 text-white animate-spin-[20s]" />
          </div>
          <span className="text-xl font-bold tracking-tight">Healix</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-extrabold tracking-tight mb-4 leading-tight">
            Reliable automation for modern workflows.
          </h2>
          <p className="text-surface-400 text-sm leading-relaxed mb-6">
            Log in to manage your repositories, configure automated webhook repair hooks, and track mean time to recovery.
          </p>

          {/* Clean terminal log block */}
          <div className="bg-surface-950 border border-surface-800 rounded-lg p-5 font-mono text-[11px] text-surface-300">
            <div className="flex items-center gap-1.5 text-surface-500 pb-2 border-b border-surface-800 mb-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>listener:active // channel:github</span>
            </div>
            <div className="space-y-1">
              <p className="text-surface-500">[02:59:12] Listening for workflow_run failure hooks...</p>
              <p className="text-brand-400">[03:00:04] Intercepted run #1892 (status: failed)</p>
              <p className="text-emerald-400">[03:00:10] Diagnostic compiled: PR branch staged</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-surface-500 font-semibold tracking-wide uppercase">
          © 2026 Healix Corp
        </div>
      </div>

      {/* Form Area (Right Panel) */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-sm flex flex-col gap-6">
          <div className="text-center md:text-left flex flex-col items-center md:items-start">
            {/* Logo visible only on mobile */}
            <div className="md:hidden flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-surface-900">Healix</span>
            </div>
            
            <h1 className="text-2xl font-extrabold text-surface-900 tracking-tight">Sign In</h1>
            <p className="text-sm text-surface-500 mt-1.5 font-medium">Sync and view repository failures</p>
          </div>

          <Card className="border border-surface-200/80">
            <CardContent className="p-6 md:p-8 space-y-6">
              {/* GitHub OAuth Button */}
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2 h-11"
                onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
              >
                <svg className="w-4 h-4 text-surface-800 fill-current" viewBox="0 0 24 24">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
                Continue with GitHub
              </Button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-surface-150" />
                <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-surface-150" />
              </div>

              {/* Error Message Box */}
              {error && (
                <div
                  role="alert"
                  className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold rounded-lg"
                >
                  {error}
                </div>
              )}

              {/* Credentials Sign In Form */}
              <form onSubmit={handleCredentials} className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@company.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
                
                <div className="space-y-1.5">
                  <Input
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 font-bold tracking-wide uppercase text-xs"
                  isLoading={loading}
                >
                  Sign In
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="text-center space-y-2 text-xs font-semibold">
            <p className="text-surface-450">
              Don't have an account?{' '}
              <Link href="/signup" className="text-brand-600 hover:text-brand-700 transition-colors underline underline-offset-4">
                Create one
              </Link>
            </p>
            <p className="text-surface-450">
              Or explore instantly{' '}
              <Link href="/dashboard" className="text-surface-700 hover:text-surface-900 transition-colors underline underline-offset-4">
                Continue as Guest →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
