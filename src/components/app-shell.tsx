'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Activity, 
  Settings, 
  Sparkles, 
  RefreshCw, 
  LogOut, 
  Menu, 
  X, 
  GitBranch, 
  ExternalLink,
  ShieldAlert,
  Terminal,
  Radio
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AppShellProps {
  children: React.ReactNode;
  userEmail?: string | null;
  isAuthed?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onOpenSimulate?: () => void;
  onResetSession?: () => void;
  activeRepo?: string;
  totalIncidents?: number;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  userEmail,
  isAuthed = false,
  onRefresh,
  isRefreshing = false,
  onOpenSimulate,
  onResetSession,
  activeRepo,
  totalIncidents = 0,
}) => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    {
      label: 'Incident Console',
      href: '/dashboard',
      icon: Activity,
      badge: totalIncidents > 0 ? totalIncidents.toString() : undefined,
    },
    {
      label: 'Integrations & Settings',
      href: '/dashboard/settings',
      icon: Settings,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F4EF] text-[#20221F] flex flex-col md:flex-row antialiased">
      {/* Mobile Header */}
      <header className="md:hidden bg-[#FFFFFF] border-b border-[#DDDFD7] px-4 py-2.5 flex items-center justify-between sticky top-0 z-40">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[#20221F] flex items-center justify-center text-white font-bold text-xs">
            <span className="text-[#D65A31]">H</span>
          </div>
          <span className="font-bold text-sm tracking-tight text-[#20221F]">Healix</span>
          <span className="text-[10px] font-mono text-[#696D65] px-1.5 py-0.2 rounded bg-[#ECEDE7] border border-[#DDDFD7]">
            v2.0
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {onOpenSimulate && (
            <Button
              size="xs"
              onClick={onOpenSimulate}
              className="bg-[#D65A31] text-white"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              <span>Simulate</span>
            </Button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-md hover:bg-[#ECEDE7] text-[#696D65]"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Sidebar Overlay for Mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed md:sticky top-0 bottom-0 left-0 z-50 md:z-30 w-64 bg-[#FFFFFF] border-r border-[#DDDFD7] flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } h-screen`}
      >
        {/* Top: Brand & Nav */}
        <div className="flex flex-col">
          {/* Brand Header */}
          <div className="h-14 px-5 border-b border-[#DDDFD7] flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded-md bg-[#20221F] group-hover:bg-[#353833] transition-colors flex items-center justify-center text-white font-bold text-xs shadow-2xs">
                <span className="text-[#D65A31] font-mono font-black">H</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-[#20221F]">Healix</span>
                <span className="text-[10px] font-mono text-[#696D65] px-1.5 py-0.2 rounded bg-[#ECEDE7] border border-[#DDDFD7]">
                  v2.0
                </span>
              </div>
            </Link>
            <div className="flex items-center gap-1 text-[11px] font-mono text-[#26764F] bg-[#E8F2EA] px-2 py-0.5 rounded border border-[#C3DEC8]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#26764F]" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Live</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="p-3 space-y-1">
            <div className="px-2 py-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-[#696D65]">
              Operations
            </div>
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-subtle ${
                    active
                      ? 'bg-[#FBEFEA] text-[#D65A31] font-semibold border border-[#F1CCBE]'
                      : 'text-[#4B4F47] hover:bg-[#F5F4EF] hover:text-[#20221F] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${active ? 'text-[#D65A31]' : 'text-[#696D65]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                        active
                          ? 'bg-[#D65A31] text-white'
                          : 'bg-[#ECEDE7] text-[#696D65]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Monitored Context Panel */}
          <div className="px-3 pt-2">
            <div className="p-3 bg-[#F5F4EF] border border-[#DDDFD7] rounded-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-semibold text-[#696D65] uppercase tracking-wider">
                  Monitored Scope
                </span>
                <span className="w-2 h-2 rounded-full bg-[#26764F]" title="Listener active" />
              </div>
              <div className="flex items-center gap-2 font-mono text-xs text-[#20221F] truncate">
                <GitBranch className="w-3.5 h-3.5 text-[#D65A31] flex-shrink-0" />
                <span className="truncate font-medium">{activeRepo || 'All Configured Repos'}</span>
              </div>
              <p className="text-[10px] text-[#696D65] leading-tight">
                Listening for GitHub Actions workflow failure webhooks.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom: User Session & Actions */}
        <div className="p-3 border-t border-[#DDDFD7] space-y-2">
          {/* Quick Simulate Button */}
          {onOpenSimulate && (
            <Button
              onClick={onOpenSimulate}
              variant="primary"
              size="sm"
              className="w-full justify-center"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-white/90" />
              <span>Simulate Incident</span>
            </Button>
          )}

          {/* User / Session Card */}
          <div className="p-2.5 bg-[#ECEDE7] rounded-md border border-[#DDDFD7] flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-[10px] font-mono uppercase tracking-wider text-[#696D65]">
                {isAuthed ? 'Authenticated' : 'Guest Sandbox'}
              </p>
              <p className="text-xs font-medium text-[#20221F] truncate">
                {userEmail || 'Local Demo Session'}
              </p>
            </div>
            {onResetSession && (
              <button
                onClick={onResetSession}
                className="p-1 rounded text-[#696D65] hover:text-[#B83D38] hover:bg-[#F8E9E6] transition-colors cursor-pointer"
                title={isAuthed ? 'Sign Out' : 'Reset Guest State'}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Top Bar */}
        <header className="hidden md:flex h-14 bg-[#FFFFFF] border-b border-[#DDDFD7] px-6 items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold text-[#20221F]">
              {pathname === '/dashboard/settings' ? 'Integrations & Engine Settings' : 'Autonomous Incident Console'}
            </h1>
            <span className="text-[#DDDFD7]">|</span>
            <div className="flex items-center gap-1.5 text-xs text-[#696D65] font-mono">
              <Radio className="w-3 h-3 text-[#26764F]" />
              <span>Webhook Ingestion Active</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin text-[#D65A31]' : ''}`} />
                <span>Refresh</span>
              </Button>
            )}

            {onOpenSimulate && (
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenSimulate}
                className="text-xs"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                <span>Simulate Incident</span>
              </Button>
            )}

            <Link
              href="/"
              className="text-xs font-mono text-[#696D65] hover:text-[#20221F] px-2 py-1 rounded hover:bg-[#ECEDE7] transition-colors"
            >
              Public Overview
            </Link>
          </div>
        </header>

        {/* Page Children */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
