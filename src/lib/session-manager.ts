import { prisma } from '@/lib/prisma';

export type SessionState = {
  repoFullName?: string;
  recentFailures: string[];
  analysisHistory: any[];
  autoPrEnabled: boolean;
};

const LS_KEY = 'healix_session_v1';

export const INITIAL_STATE: SessionState = {
  recentFailures: [],
  analysisHistory: [],
  autoPrEnabled: true,
};

/**
 * Client-side session manager to handle Guest (localStorage) and Authenticated (DB) states.
 */
export const SessionManager = {
  get: (): SessionState => {
    if (typeof window === 'undefined') return INITIAL_STATE;
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return INITIAL_STATE;
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_STATE;
    }
  },

  set: (state: SessionState) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  },

  reset: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(LS_KEY);
  },

  // In a real app, this would be a server action or API call
  syncToDb: async (userId: string, state: SessionState) => {
    // Placeholder for syncing logic
    console.log(`Syncing state for user ${userId} to DB...`);
    // This would update the User or Repository models in Prisma
  },

  exportData: () => {
    const state = SessionManager.get();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "healix_session_data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }
};
