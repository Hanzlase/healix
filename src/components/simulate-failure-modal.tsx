'use client';

import React, { useState } from 'react';
import { Sparkles, X, Check, AlertTriangle, Zap, Database, Package, Terminal, Play, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SimulateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulated: (failureId: string) => void;
  defaultRepo?: string;
}

const PRESETS = [
  {
    id: 'auth_type_error',
    title: 'TypeScript Type Error in Auth',
    category: 'Runtime Error',
    icon: Zap,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    description: "TypeError: Cannot read properties of undefined (reading 'sessionToken') during user auth token validation.",
    workflow: 'Test & Lint Suite',
    affectedFile: 'src/lib/auth.ts',
  },
  {
    id: 'prisma_migration',
    title: 'Prisma Schema Drift / Field Mismatch',
    category: 'Database / Build',
    icon: Database,
    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    description: "PrismaClientKnownRequestError: Column 'fullName' does not exist in table 'users'. Did you mean 'name'?",
    workflow: 'E2E Integration Pipeline',
    affectedFile: 'src/services/user-service.ts',
  },
  {
    id: 'dependency_missing',
    title: 'Missing Package in Dependencies',
    category: 'Dependency Error',
    icon: Package,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    description: "ModuleNotFoundError: Cannot resolve module 'zod' in src/lib/validators.ts during Next.js build.",
    workflow: 'Production Bundle Build',
    affectedFile: 'package.json',
  },
];

export const SimulateFailureModal: React.FC<SimulateModalProps> = ({
  isOpen,
  onClose,
  onSimulated,
  defaultRepo = 'Hanzlase/healixtesting',
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('auth_type_error');
  const [repoInput, setRepoInput] = useState(defaultRepo);
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSimulate = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: selectedPreset,
          repoFullName: repoInput.trim() || 'Hanzlase/healixtesting',
          autoAnalyze,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Simulation failed');

      onSimulated(data.failureId);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to simulate failure incident');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Simulate CI/CD Failure Incident
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Test the autonomous AI healing pipeline in real-time
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          {error && (
            <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-lg text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Scenario Selection */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Select Failure Scenario
            </label>
            <div className="space-y-2">
              {PRESETS.map((p) => {
                const Icon = p.icon;
                const isSelected = selectedPreset === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPreset(p.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 relative ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/60 ring-1 ring-indigo-500/30 shadow-md'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-950/80'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5 ${p.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-100">{p.title}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                          {p.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-1 leading-relaxed line-clamp-2">
                        {p.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500 font-mono">
                        <span>Workflow: {p.workflow}</span>
                        <span>•</span>
                        <span>Target: {p.affectedFile}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Target Repository */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Target Repository
            </label>
            <input
              type="text"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              placeholder="owner/repo (e.g. Hanzlase/healixtesting)"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
            />
          </div>

          {/* Mode Switch: Auto-Heal vs Manual */}
          <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between gap-4">
            <div>
              <span className="font-bold text-slate-200 block text-xs">Execute Self-Healing Immediately</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Automatically diagnose root cause, compile fix patch, and stage PR
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAutoAnalyze(!autoAnalyze)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                autoAnalyze ? 'bg-indigo-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  autoAnalyze ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSimulate}
            isLoading={loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
          >
            {loading ? (
              <span>Simulating...</span>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Simulate & {autoAnalyze ? 'Heal' : 'Stage'} Incident</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
