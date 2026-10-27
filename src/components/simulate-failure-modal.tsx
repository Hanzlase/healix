'use client';

import React, { useState } from 'react';
import { Sparkles, X, AlertTriangle, Zap, Database, Package, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SimulateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulated: (failureId: string) => void;
  defaultRepo?: string;
}

const PRESETS = [
  {
    id: 'auth_type_error',
    title: 'TypeScript Type Error in Auth Token Handling',
    category: 'Runtime Error',
    icon: Zap,
    description: "TypeError: Cannot read properties of undefined (reading 'sessionToken') during user auth token validation.",
    workflow: 'Test & Lint Suite',
    affectedFile: 'src/lib/auth.ts',
  },
  {
    id: 'prisma_migration',
    title: 'Prisma Schema Drift / Field Mismatch',
    category: 'Database / Build',
    icon: Database,
    description: "PrismaClientKnownRequestError: Column 'fullName' does not exist in table 'users'. Did you mean 'name'?",
    workflow: 'E2E Integration Pipeline',
    affectedFile: 'src/services/user-service.ts',
  },
  {
    id: 'dependency_missing',
    title: 'Missing Package in Dependencies',
    category: 'Dependency Error',
    icon: Package,
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to simulate failure incident';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-[#FFFFFF] border border-[#DDDFD7] rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="simulate-modal-title"
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-[#DDDFD7] bg-[#F5F4EF] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#20221F] flex items-center justify-center text-[#D65A31]">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 id="simulate-modal-title" className="text-sm font-bold text-[#20221F]">
                CI/CD Incident Test Harness
              </h2>
              <p className="text-[11px] text-[#696D65] mt-0.5">
                Inject a verified CI/CD failure event to exercise the automated remediation pipeline.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#696D65] hover:text-[#20221F] hover:bg-[#E2E4DC] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-[#20221F]">
          {error && (
            <div className="p-3 bg-[#F8E9E6] border border-[#ECC3BE] rounded-md text-[#B83D38] flex items-center gap-2 text-xs">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Scenario Selection */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#696D65]">
              Target Failure Scenario
            </label>
            <div className="space-y-2">
              {PRESETS.map((p) => {
                const Icon = p.icon;
                const isSelected = selectedPreset === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPreset(p.id)}
                    className={`p-3 rounded-md border transition-subtle cursor-pointer flex items-start gap-3 relative ${
                      isSelected
                        ? 'bg-[#FBEFEA] border-[#D65A31] ring-1 ring-[#D65A31]'
                        : 'bg-[#FFFFFF] border-[#DDDFD7] hover:border-[#C4C7BE] hover:bg-[#F5F4EF]'
                    }`}
                  >
                    <div className="w-7 h-7 rounded bg-[#ECEDE7] border border-[#DDDFD7] flex items-center justify-center flex-shrink-0 mt-0.5 text-[#20221F]">
                      <Icon className="w-3.5 h-3.5 text-[#D65A31]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs text-[#20221F]">{p.title}</span>
                        <Badge variant="neutral" size="sm">
                          {p.category}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-[#696D65] font-mono mt-1 leading-normal">
                        {p.description}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[#696D65] font-mono">
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
            <label className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#696D65]">
              Target Repository
            </label>
            <input
              type="text"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              placeholder="owner/repo (e.g. Hanzlase/healixtesting)"
              className="w-full px-3 py-2 bg-white border border-[#DDDFD7] rounded-md text-xs font-mono text-[#20221F] placeholder:text-[#A8ABA2] focus:outline-none focus:border-[#D65A31] focus:ring-1 focus:ring-[#D65A31]"
            />
          </div>

          {/* Mode Switch: Auto-Heal vs Manual */}
          <div className="p-3 bg-[#F5F4EF] border border-[#DDDFD7] rounded-md flex items-center justify-between gap-4">
            <div>
              <span className="font-semibold text-[#20221F] block text-xs">Run Remediation Pipeline Immediately</span>
              <span className="text-[11px] text-[#696D65] block mt-0.5">
                Automatically diagnose root cause with Gemini, synthesize fix patch, and verify safety.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAutoAnalyze(!autoAnalyze)}
              className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                autoAnalyze ? 'bg-[#D65A31]' : 'bg-[#C4C7BE]'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                  autoAnalyze ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#DDDFD7] bg-[#F5F4EF] flex items-center justify-between gap-3">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSimulate}
            isLoading={loading}
            leftIcon={!loading ? <Play className="w-3.5 h-3.5 fill-current" /> : undefined}
          >
            {loading ? 'Simulating...' : `Simulate & ${autoAnalyze ? 'Remediate' : 'Record'} Incident`}
          </Button>
        </div>
      </div>
    </div>
  );
};
