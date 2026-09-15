'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Terminal, FileText, GitBranch, ArrowRight, CheckCircle2, TrendingUp, Sparkles, Award, UserPlus, LogIn, Lock, X, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [authModalFeature, setAuthModalFeature] = useState<{ title: string; href: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const primaryCards = [
    {
      title: 'Adaptive Mock Interview',
      description: 'Practice real-time technical questions or live coding with AI-driven adaptive follow-ups conditioned on your answers.',
      badge: 'Live Coding & Voice',
      cta: 'Start Interview',
      href: '/interview/setup',
      icon: Terminal,
      gradient: 'from-indigo-600/20 via-purple-600/10 to-transparent',
      borderColor: 'border-indigo-500/30 hover:border-indigo-500/60',
      iconColor: 'text-indigo-400',
      btnBg: 'bg-indigo-600 hover:bg-indigo-500 text-white',
    },
    {
      title: 'Resume & Profile Analysis',
      description: 'Upload your resume for instant ATS scoring, section-level breakdown, and impactful bullet rewrite suggestions.',
      badge: 'ATS Scoring 0-100',
      cta: 'Analyze Resume',
      href: '/resume',
      icon: FileText,
      gradient: 'from-sky-600/20 via-blue-600/10 to-transparent',
      borderColor: 'border-sky-500/30 hover:border-sky-500/60',
      iconColor: 'text-sky-400',
      btnBg: 'bg-sky-600 hover:bg-sky-500 text-white',
    },
    {
      title: 'GitHub Repo Analysis',
      description: 'Score your real codebases with static signals & LLM evaluation. Get file-referenced critiques and push weak areas to your roadmap.',
      badge: 'New Feature P0',
      cta: 'Analyze a Repo',
      href: '/repo-analysis',
      icon: GitBranch,
      gradient: 'from-emerald-600/20 via-teal-600/10 to-transparent',
      borderColor: 'border-emerald-500/30 hover:border-emerald-500/60',
      iconColor: 'text-emerald-400',
      btnBg: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    },
  ];

  if (!mounted || loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <div className="text-slate-400 text-sm">Loading workspace...</div>
      </div>
    );
  }

  // Not logged in: Show Guest Landing Page
  if (!user) {
    return (
      <div className="space-y-12 py-4">
        {/* Auth Required Modal */}
        {authModalFeature && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700/80 p-6 sm:p-7 shadow-2xl shadow-indigo-950/50 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Login or Sign Up Required</h3>
                    <p className="text-xs text-slate-400">Please authenticate to continue</p>
                  </div>
                </div>
                <button
                  onClick={() => setAuthModalFeature(null)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <p className="text-sm text-slate-200 font-medium">
                  You must log in or sign up first to use <span className="text-indigo-400 font-semibold">{authModalFeature.title}</span>.
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Join our AI platform to take adaptive mock interviews, execute code live, get ATS resume feedback, and audit your GitHub repositories.
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                <Link
                  href={`/login?mode=signin&redirect=${encodeURIComponent(authModalFeature.href)}&feature=${encodeURIComponent(authModalFeature.title)}`}
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 hover:scale-[1.01] transition-all"
                >
                  <LogIn className="w-4 h-4" /> Sign In
                </Link>
                <Link
                  href={`/login?mode=signup&redirect=${encodeURIComponent(authModalFeature.href)}&feature=${encodeURIComponent(authModalFeature.title)}`}
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-semibold text-sm transition-all"
                >
                  <UserPlus className="w-4 h-4" /> Create Free Account
                </Link>
                <button
                  type="button"
                  onClick={() => setAuthModalFeature(null)}
                  className="w-full py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 p-8 sm:p-14 shadow-2xl text-center">
          <div className="absolute top-0 right-1/4 -mt-16 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-indigo-400" /> Paradox : The AI Interview Assistant
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              Master Interviews With <br />
              <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
                Adaptive AI & Real Code
              </span>
            </h1>

            <p className="text-slate-400 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
              Simulate realistic mock interviews with live code execution, optimize your resume for ATS parsers, and get deep security & quality reviews on your actual GitHub repositories.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href="/login?mode=signup"
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 hover:scale-[1.02] transition-all"
              >
                <UserPlus className="w-4 h-4" /> Create Free Account
              </Link>
              <Link
                href="/login?mode=signin"
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm transition-all"
              >
                <LogIn className="w-4 h-4" /> Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* 3 Core Pillars */}
        <div className="space-y-6">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Three Pillars of Preparation</h2>
            <p className="text-slate-400 text-sm">Comprehensive evaluation across your resume, answers, and actual code.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {primaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className={`flex flex-col justify-between rounded-3xl border ${card.borderColor} bg-gradient-to-b ${card.gradient} bg-slate-900/40 p-7 backdrop-blur-md shadow-xl transition-all group`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className={`p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner ${card.iconColor}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300">
                        {card.badge}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2.5 group-hover:text-indigo-300 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed mb-6">
                      {card.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAuthModalFeature({ title: card.title, href: card.href })}
                    className={`inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-medium text-sm ${card.btnBg} transition-all shadow-md group-hover:gap-3 cursor-pointer`}
                  >
                    Try Feature
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Logged-in Dashboard
  const displayName = user.name || user.email?.split('@')[0] || 'Candidate';

  return (
    <div className="space-y-10">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 p-8 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Candidate Workspace · {user.targetRole || 'Software Engineer'}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Welcome, <span className="bg-gradient-to-r from-indigo-400 to-sky-400 bg-clip-text text-transparent">{displayName}</span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed mb-6">
            Begin an adaptive mock interview, optimize your resume bullets, or connect your GitHub repositories for automated code review.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/interview/setup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 text-white font-medium text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] transition-all"
            >
              <Terminal className="w-4 h-4" /> Start Quick Session
            </Link>
            <Link
              href="/repo-analysis"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-medium text-sm transition-all"
            >
              <GitBranch className="w-4 h-4 text-emerald-400" /> Analyze a Repo
            </Link>
          </div>
        </div>
      </div>

      {/* Dynamic Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Readiness Status</span>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 p-0.5">
              <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">New</div>
          <div className="text-xs text-slate-400">Complete 1 session to score</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Interviews Completed</span>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 p-0.5">
              <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
                <Terminal className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">0</div>
          <div className="text-xs text-slate-400">Ready for your first loop</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Repos Analyzed</span>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-500 p-0.5">
              <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
                <GitBranch className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">0</div>
          <div className="text-xs text-slate-400">No projects audited yet</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Roadmap Progress</span>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 p-0.5">
              <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
                <Award className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">0%</div>
          <div className="text-xs text-slate-400">Generated after evaluation</div>
        </div>
      </div>

      {/* Primary 3 Action Cards */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Core Evaluation Pillars</h2>
            <p className="text-sm text-slate-400">Everything you need to benchmark your interview readiness.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {primaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className={`flex flex-col justify-between rounded-3xl border ${card.borderColor} bg-gradient-to-b ${card.gradient} bg-slate-900/40 p-7 backdrop-blur-md shadow-xl transition-all group`}
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className={`p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner ${card.iconColor}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300">
                      {card.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2.5 group-hover:text-indigo-300 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-6">
                    {card.description}
                  </p>
                </div>

                <Link
                  href={card.href}
                  className={`inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-medium text-sm ${card.btnBg} transition-all shadow-md group-hover:gap-3`}
                >
                  {card.cta}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Section: Fresh User State & Next Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Evaluations Empty State */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-800 bg-slate-900/50 p-7 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-base">Recent Evaluations</h3>
              <span className="text-xs text-slate-400">Activity Log</span>
            </div>

            <div className="border border-dashed border-slate-800 rounded-2xl p-8 text-center space-y-3 bg-slate-950/40">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
                <Terminal className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-slate-200">No mock sessions completed yet</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Launch your first technical interview or analyze a repo to get structured feedback with citations and numeric sub-scores.
              </p>
              <div className="pt-2">
                <Link
                  href="/interview/setup"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all"
                >
                  Start First Session <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Learning Roadmap Snapshot */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-7 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-base">Study Roadmap</h3>
              <span className="text-xs text-slate-500">Not started</span>
            </div>

            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-5">
              <div className="h-full bg-slate-700 rounded-full w-0 transition-all"></div>
            </div>

            <div className="space-y-3 text-xs text-slate-400">
              <div className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center mt-0.5 shrink-0 text-[10px]">1</div>
                <span>Take a mock interview or submit your repository code</span>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center mt-0.5 shrink-0 text-[10px]">2</div>
                <span>AI identifies weak topics & architectural pitfalls</span>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center mt-0.5 shrink-0 text-[10px]">3</div>
                <span>Generate curated study steps with time estimates</span>
              </div>
            </div>
          </div>

          <Link
            href="/roadmap"
            className="mt-6 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-all"
          >
            Explore Roadmap System <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
