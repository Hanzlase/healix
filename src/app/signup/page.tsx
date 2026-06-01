'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

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
        // Automatically sign in after sign up
        const signInRes = await signIn('credentials', { email, password, redirect: false });
        if (signInRes?.error) {
          setError('Account created, but could not sign in automatically.');
          setLoading(false);
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err) {
      setError('An error occurred during sign up.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100 group-hover:rotate-12 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">Healix</span>
          </Link>
          <p className="text-slate-500 text-sm mt-4">Create an account to get started in minutes</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
          {/* GitHub OAuth */}
          <button onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-sm mb-6">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
            </svg>
            Continue with GitHub
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-slate-100"/>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-slate-100"/>
          </div>

          <form onSubmit={handleCredentials} className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-slate-50"/>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-slate-50"/>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-slate-50"/>
            </div>
            {error && <p className="text-xs text-rose-500 font-semibold">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-100">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 mb-3">Already have an account?</p>
            <Link href="/signin" className="text-sm font-black text-blue-600 hover:text-blue-700 transition-colors">
              Sign In →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
