'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type FailureItem = {
  id: string;
  repoName: string;
  commitSha: string;
  status: 'pending' | 'analyzed';
  createdAt: string;
};

type AnalysisItem = {
  failureId: string;
  createdAt: string;
  root_cause: string;
  category: string;
  confidence: number;
  affected_file: string;
};

const LS_KEY = 'healix_guest_session_v1';

function loadGuestSession(): { repoFullName?: string; recentFailures: string[]; analysisHistory: AnalysisItem[] } {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { recentFailures: [], analysisHistory: [] };
    const parsed = JSON.parse(raw);
    return {
      repoFullName: parsed.repoFullName,
      recentFailures: parsed.recentFailures ?? [],
      analysisHistory: parsed.analysisHistory ?? [],
    };
  } catch {
    return { recentFailures: [], analysisHistory: [] };
  }
}

function saveGuestSession(next: { repoFullName?: string; recentFailures: string[]; analysisHistory: AnalysisItem[] }) {
  localStorage.setItem(LS_KEY, JSON.stringify(next));
}

export default function DashboardPage() {
  // Initialize from localStorage lazily (client-only)
  const [repoFullName, setRepoFullName] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return loadGuestSession().repoFullName ?? '';
  });

  // Phase 1: Dummy feed until webhook+DB read endpoints are built.
  const [failures] = useState<FailureItem[]>([]);

  const [selectedFailureId, setSelectedFailureId] = useState<string>('');

  const selectedFailure = useMemo(
    () => failures.find((f) => f.id === selectedFailureId),
    [failures, selectedFailureId]
  );

  const analysis = useMemo(() => {
    if (!selectedFailureId) return null;
    const sess = typeof window === 'undefined' ? { analysisHistory: [] as AnalysisItem[] } : loadGuestSession();
    return sess.analysisHistory.find((a) => a.failureId === selectedFailureId) ?? null;
  }, [selectedFailureId]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">Lightweight Phase 1 failure detection + analysis.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm" href="/">
              Home
            </Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="lg:col-span-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-800">Repository Selector</h2>
              <p className="mt-1 text-xs text-slate-500">(Guest mode persists in localStorage)</p>
              <input
                value={repoFullName}
                onChange={(e) => {
                  const v = e.target.value;
                  setRepoFullName(v);
                  const sess = loadGuestSession();
                  saveGuestSession({ ...sess, repoFullName: v, recentFailures: sess.recentFailures, analysisHistory: sess.analysisHistory });
                }}
                placeholder="owner/repo"
                className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200"
              />
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-800">Failure Feed</h2>
              <div className="mt-3 space-y-2">
                {failures.length === 0 ? (
                  <p className="text-sm text-slate-500">No failures yet. Send a GitHub workflow_run failure webhook.</p>
                ) : (
                  failures.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFailureId(f.id)}
                      className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${
                        selectedFailureId === f.id ? 'border-sky-300 bg-sky-50' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{f.commitSha.slice(0, 7)}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            f.status === 'analyzed'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {f.status}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{f.repoName}</div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="lg:col-span-9">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-800">Selected Failure</h2>
                {selectedFailure ? (
                  <div className="mt-3 space-y-2 text-sm">
                    <div>
                      <div className="text-xs text-slate-500">Repository</div>
                      <div className="font-medium">{selectedFailure.repoName}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Commit</div>
                      <div className="font-mono">{selectedFailure.commitSha}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Status</div>
                      <div>{selectedFailure.status}</div>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">Select a failure in the feed.</p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-800">Analysis Panel</h2>
                {analysis ? (
                  <div className="mt-3 space-y-3 text-sm">
                    <div>
                      <div className="text-xs text-slate-500">Root cause</div>
                      <div className="mt-1 leading-relaxed">{analysis.root_cause}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-slate-500">Category</div>
                        <div className="font-medium">{analysis.category}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Confidence</div>
                        <div className="font-medium">{analysis.confidence.toFixed(2)}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Affected file</div>
                      <div className="font-mono">{analysis.affected_file}</div>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">No analysis loaded yet.</p>
                )}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-800">How to test Phase 1</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-600">
                <li>Set env vars in <code className="rounded bg-slate-100 px-1">.env</code> (see <code className="rounded bg-slate-100 px-1">.env.example</code>).</li>
                <li>Run Prisma migrations and start the app.</li>
                <li>Point GitHub webhook to <code className="rounded bg-slate-100 px-1">/api/webhooks/github</code> (workflow_run events) and ensure secret matches.</li>
                <li>Use <code className="rounded bg-slate-100 px-1">/api/analyze</code> with a stored failure + run metadata to trigger Gemini.</li>
              </ol>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
