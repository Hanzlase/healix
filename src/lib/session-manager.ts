/**
 * Client-side session manager for Guest mode (localStorage).
 * NO server-side imports — this file is used in browser-only contexts.
 */

export type SessionState = {
  mode: 'guest' | 'authenticated';
  repoFullName?: string;
  recentFailures: string[];   // failure IDs
  analysisHistory: AnalysisHistoryItem[];
  autoPrEnabled: boolean;
};

export type AnalysisHistoryItem = {
  failureId: string;
  repoName: string;
  commitSha: string;
  rootCause: string;
  category: string;
  confidence: number;
  affectedFile: string;
  reviewStatus?: string;
  prLink?: string;
  createdAt: string;
};

const LS_KEY = 'healix_session_v1';

export const INITIAL_STATE: SessionState = {
  mode: 'guest',
  recentFailures: [],
  analysisHistory: [],
  autoPrEnabled: true,
};

export const SessionManager = {
  get: (): SessionState => {
    if (typeof window === 'undefined') return INITIAL_STATE;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return INITIAL_STATE;
      return { ...INITIAL_STATE, ...JSON.parse(raw) };
    } catch {
      return INITIAL_STATE;
    }
  },

  set: (state: SessionState): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  },

  update: (partial: Partial<SessionState>): void => {
    const current = SessionManager.get();
    SessionManager.set({ ...current, ...partial });
  },

  addFailure: (id: string): void => {
    const s = SessionManager.get();
    const ids = Array.from(new Set([id, ...s.recentFailures])).slice(0, 50);
    SessionManager.set({ ...s, recentFailures: ids });
  },

  addAnalysis: (item: AnalysisHistoryItem): void => {
    const s = SessionManager.get();
    const history = [item, ...s.analysisHistory.filter(a => a.failureId !== item.failureId)].slice(0, 100);
    SessionManager.set({ ...s, analysisHistory: history });
  },

  reset: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(LS_KEY);
  },

  exportData: (): void => {
    if (typeof window === 'undefined') return;
    const state = SessionManager.get();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', 'healix_session_data.json');
    document.body.appendChild(a);
    a.click();
    a.remove();
  },
};
