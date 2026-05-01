import Link from 'next/link';

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-lg px-6 py-16">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="mt-2 text-sm text-slate-600">
            Use GitHub OAuth (if configured) or credentials (if enabled).
          </p>
          <div className="mt-6 space-y-3">
            <a
              className="block w-full rounded-xl bg-slate-900 px-4 py-2.5 text-center text-sm font-medium text-white"
              href="/api/auth/signin"
            >
              Continue
            </a>
            <Link className="block text-sm text-slate-600 underline" href="/">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
