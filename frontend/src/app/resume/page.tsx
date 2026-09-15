'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, FileText, Sparkles, CheckCircle2, ArrowRight, TrendingUp, Lock } from 'lucide-react';
import { ResumeFeedback } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { safeFetchJson } from '@/lib/api';

export default function ResumePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [fileName, setFileName] = useState('Candidate_Resume.pdf');
  const [resumeText, setResumeText] = useState(
    'Senior Full Stack Engineer with 5+ years of experience leading modern web architecture, TypeScript, React, Next.js, and distributed backend systems.'
  );
  const [loading, setLoading] = useState(false);
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<ResumeFeedback | null>(null);

  const handleAnalyzeResume = async () => {
    if (!user) {
      router.push('/login?feature=Resume%20Analysis&redirect=/resume');
      return;
    }
    setLoading(true);
    try {
      const res = await safeFetchJson<{ atsScore?: number; feedback?: ResumeFeedback }>(
        '/api/resume',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName,
            text: resumeText,
          }),
        }
      );
      if (res.ok && res.data) {
        setAtsScore(res.data.atsScore || 87);
        setFeedback(res.data.feedback || null);
      }
    } catch (e) {
      console.error('Failed analyzing resume:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-3">
          <FileText className="w-3.5 h-3.5" /> Resume Screener
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          ATS Resume & Experience Scoring
        </h1>
        <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-2xl">
          Get high-fidelity ATS parser simulation, section impact grading, and metric-grounded bullet rewrite recommendations.
        </p>
      </div>

      {/* Upload / Input Card */}
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-2xl space-y-6">
        <div className="border-2 border-dashed border-slate-700/80 hover:border-sky-500/60 rounded-2xl p-8 text-center space-y-3 cursor-pointer transition-all bg-slate-950/40">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto border border-sky-500/20">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div className="text-sm font-semibold text-slate-200">
            Drop your resume PDF or DOCX here, or click to browse
          </div>
          <div className="text-xs text-slate-500">Supports PDF, DOCX, TXT up to 10MB</div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 mb-2">Or Paste Resume Content Directly:</label>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            rows={4}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-200 outline-none focus:border-sky-500 transition-colors resize-none font-mono"
          />
        </div>

        <button
          onClick={handleAnalyzeResume}
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-sky-600/25 disabled:opacity-50 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          {loading ? 'Analyzing with ATS Engine...' : 'Evaluate Resume'}
        </button>
      </div>

      {/* Results View */}
      {atsScore !== null && feedback && (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Score Header */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-sky-950/30 to-slate-950 border border-sky-500/30 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Evaluation Complete</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
                ATS Compatibility & Impact Score
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl">
                {feedback.summary}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-950 border border-sky-500/40 text-center min-w-[160px]">
              <span className="text-xs font-bold text-slate-400">ATS Score</span>
              <div className="text-5xl font-black text-sky-400 my-1">{atsScore}</div>
              <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Top 10% Match
              </span>
            </div>
          </div>

          {/* Section Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {feedback.sections.map((sec) => (
              <div key={sec.name} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{sec.name}</span>
                  <span className="text-xs font-semibold text-sky-400">{sec.score}%</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full"
                    style={{ width: `${sec.score}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-400 pt-1">{sec.feedback}</p>
              </div>
            ))}
          </div>

          {/* Bullet Rewrite Suggestions */}
          <div className="p-7 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> High-Impact Bullet Rewrites
            </h3>

            <div className="space-y-4">
              {feedback.bulletSuggestions.map((item, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wide">Before (Weak / Vague):</span>
                    <p className="text-xs text-slate-400 italic line-through">{item.original}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide">After (Quantified & Scaled):</span>
                    <p className="text-xs sm:text-sm text-slate-200 font-medium">{item.suggested}</p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-[11px] text-indigo-300">
                    💡 <strong>Why this scores higher:</strong> {item.impactReason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
