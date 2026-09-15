'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Terminal, Mic, Video, ShieldCheck, ArrowRight, GitBranch, Radio, Lock } from 'lucide-react';
import { InterviewMode, CompanyStyle, RoleLevel } from '@/types';
import { useAuth } from '@/context/AuthContext';

export default function InterviewSetupPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Config form state
  const [role, setRole] = useState('Full Stack Engineer');
  const [experienceLevel, setExperienceLevel] = useState<RoleLevel>('Senior');
  const [mode, setMode] = useState<InterviewMode>('Live Coding');
  const [companyStyle, setCompanyStyle] = useState<CompanyStyle>('Google-style');
  const [language, setLanguage] = useState('English');
  const [attachedRepoUrl, setAttachedRepoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Hardware check states
  const [micActive, setMicActive] = useState(true);
  const [cameraActive, setCameraActive] = useState(true);
  const [screenShareActive, setScreenShareActive] = useState(true);

  const handleStartInterview = async () => {
    if (!user) {
      router.push('/login?feature=Adaptive%20Mock%20Interview&redirect=/interview/setup');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            role,
            experienceLevel,
            mode,
            companyStyle,
            language,
            attachedRepoUrl: attachedRepoUrl || undefined,
          },
        }),
      });
      const data = await res.json();
      if (data.interviewId) {
        router.push(`/interview/session?id=${data.interviewId}`);
      }
    } catch (e) {
      console.error('Error starting interview session:', e);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-3">
          <Terminal className="w-3.5 h-3.5" /> Session Configuration
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Configure Your Mock Technical Interview
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Customize the AI interviewer&apos;s style, difficulty, evaluation mode, and hardware permissions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Form Config */}
        <div className="lg:col-span-2 space-y-6">
          {/* Target Role & Level */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span> Role & Seniority
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Target Role</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors"
                  placeholder="e.g. Senior Backend Engineer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Experience Level</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as RoleLevel)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="Junior">Junior (0-2 years)</option>
                  <option value="Mid-Level">Mid-Level (2-5 years)</option>
                  <option value="Senior">Senior (5+ years)</option>
                  <option value="Staff">Staff / Principal</option>
                </select>
              </div>
            </div>
          </div>

          {/* Mode & Style */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400"></span> Evaluation Format & Tone
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">Interview Mode</label>
              <div className="grid grid-cols-3 gap-3">
                {(['Live Coding', 'Technical Q&A', 'Behavioral'] as InterviewMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`py-3 px-3 rounded-xl border text-xs font-semibold transition-all text-center ${
                      mode === m
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-500/10'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Target Company Style</label>
                <select
                  value={companyStyle}
                  onChange={(e) => setCompanyStyle(e.target.value as CompanyStyle)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="Google-style">Google-style (Algorithmic & Scale)</option>
                  <option value="Startup-style">Startup-style (Pragmatic & Shipping)</option>
                  <option value="Amazon-style">Amazon-style (Leadership Principles & Depth)</option>
                  <option value="Meta-style">Meta-style (Fast Execution & Architecture)</option>
                  <option value="General">General Technical</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Spoken Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="German">German</option>
                  <option value="French">French</option>
                </select>
              </div>
            </div>
          </div>

          {/* Attach GitHub Repo (Optional Stretch P2) */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-emerald-400" /> Attach Portfolio Project (Optional)
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                P2 Feature
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Link your repository so the interviewer can ask questions directly referencing your actual architecture and codebase.
            </p>
            <input
              type="text"
              value={attachedRepoUrl}
              onChange={(e) => setAttachedRepoUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-emerald-500 transition-colors"
              placeholder="https://github.com/username/project"
            />
          </div>
        </div>

        {/* Right Col: Hardware Verification & Launch */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Pre-Flight Hardware Check
            </h2>

            <div className="space-y-3">
              {/* Mic check */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Mic className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs text-slate-300">Microphone</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMicActive(!micActive)}
                  className={`text-[11px] font-semibold px-2 py-1 rounded-md transition-colors ${
                    micActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}
                >
                  {micActive ? 'Ready' : 'Muted'}
                </button>
              </div>

              {/* Camera check */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Video className="w-4 h-4 text-sky-400" />
                  <span className="text-xs text-slate-300">Camera Feed</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCameraActive(!cameraActive)}
                  className={`text-[11px] font-semibold px-2 py-1 rounded-md transition-colors ${
                    cameraActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {cameraActive ? 'Connected' : 'Disabled'}
                </button>
              </div>

              {/* Anti-cheat screen share */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Radio className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-slate-300">Integrity Monitor</span>
                </div>
                <span className="text-[11px] font-semibold px-2 py-1 rounded-md bg-amber-500/10 text-amber-400">
                  Tab Logger Active
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-300 leading-relaxed">
              💡 <strong>Interview Tip:</strong> Communicate your thought process out loud. The AI tracks both algorithmic correctness and architectural explanation.
            </div>

            <button
              type="button"
              onClick={handleStartInterview}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 disabled:opacity-50 transition-all hover:scale-[1.01]"
            >
              {isLoading ? 'Starting Session...' : 'Enter Live Interview'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
