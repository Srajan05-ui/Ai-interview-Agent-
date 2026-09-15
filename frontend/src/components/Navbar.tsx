'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Terminal, FileText, GitBranch, Map, User as UserIcon, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AuthModal from '@/components/AuthModal';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [authModalFeature, setAuthModalFeature] = useState<{ title: string; href: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { name: 'Dashboard', href: '/', icon: Sparkles },
    { name: 'Mock Interview', href: '/interview/setup', icon: Terminal },
    { name: 'Resume Review', href: '/resume', icon: FileText },
    { name: 'Repo Analysis', href: '/repo-analysis', icon: GitBranch },
    { name: 'Roadmap', href: '/roadmap', icon: Map },
  ];

  const handleNavClick = (e: React.MouseEvent, item: typeof navItems[0]) => {
    if (item.href !== '/' && !user) {
      e.preventDefault();
      setAuthModalFeature({ title: item.name, href: item.href });
    }
  };

  return (
    <>
      <AuthModal feature={authModalFeature} onClose={() => setAuthModalFeature(null)} />
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Terminal className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg bg-gradient-to-r from-white via-indigo-200 to-sky-400 bg-clip-text text-transparent tracking-tight">
                  Paradox
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                  AI Assistant
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium tracking-tight -mt-0.5 hidden sm:block">
                The AI Interview Assistant
              </div>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1" suppressHydrationWarning>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = mounted && pathname
                ? pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                : false;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  suppressHydrationWarning
                  onClick={(e) => handleNavClick(e, item)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

        {/* User Profile / Auth Area */}
        <div className="flex items-center gap-3">
          {mounted && user ? (
            <div className="flex items-center gap-3">
              {user.githubConnected && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-400 font-medium whitespace-nowrap">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                  <span>GitHub Connected</span>
                </div>
              )}

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-slate-200 leading-tight">{user.name}</div>
                  <div className="text-[10px] text-slate-500 leading-tight">{user.targetRole || 'Candidate'}</div>
                </div>
              </div>

              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all"
              >
                <LogIn className="w-4 h-4" /> Sign In
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 hover:opacity-95 transition-all"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
    </>
  );
}
