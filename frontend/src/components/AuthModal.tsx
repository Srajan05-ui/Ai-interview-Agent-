'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, X, LogIn, UserPlus } from 'lucide-react';

interface AuthModalProps {
  feature: { title: string; href: string } | null;
  onClose: () => void;
}

export default function AuthModal({ feature, onClose }: AuthModalProps) {
  if (!feature) return null;

  return (
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
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
          <p className="text-sm text-slate-200 font-medium">
            You must log in or sign up first to use <span className="text-indigo-400 font-semibold">{feature.title}</span>.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Join Paradox to take adaptive mock interviews, execute code live, get ATS resume feedback, and audit your GitHub repositories.
          </p>
        </div>

        <div className="space-y-2.5 pt-1">
          <Link
            href={`/login?mode=signin&redirect=${encodeURIComponent(feature.href)}&feature=${encodeURIComponent(feature.title)}`}
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 hover:scale-[1.01] transition-all"
          >
            <LogIn className="w-4 h-4" /> Sign In
          </Link>
          <Link
            href={`/login?mode=signup&redirect=${encodeURIComponent(feature.href)}&feature=${encodeURIComponent(feature.title)}`}
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-semibold text-sm transition-all"
          >
            <UserPlus className="w-4 h-4" /> Create Free Account
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
