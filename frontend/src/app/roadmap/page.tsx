'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Map, CheckCircle2, Circle, Clock, ExternalLink, Sparkles, Terminal, GitBranch } from 'lucide-react';
import { Roadmap, RoadmapStep } from '@/types';

function RoadmapContent() {
  const searchParams = useSearchParams();
  const queryId = searchParams.get('id');

  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [isLoading, setIsLoading] = useState(!!queryId);

  useEffect(() => {
    if (queryId) {
      fetch(`/api/roadmap/${queryId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.steps) setRoadmap(data);
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [queryId]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[50vh] space-y-6">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin"></div>
        <p className="text-slate-400 font-medium animate-pulse">Generating your personalized AI roadmap...</p>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center shadow-xl shadow-indigo-500/10 border border-slate-800">
          <Map className="w-10 h-10 text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">No Roadmap Found</h2>
        <p className="text-slate-400 max-w-md mx-auto">
          You haven't generated a learning roadmap yet. Complete a mock interview to get an adaptive study plan tailored to your weak areas!
        </p>
        <button 
          onClick={() => window.location.href = '/interview/setup'}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all"
        >
          Take a Mock Interview
        </button>
      </div>
    );
  }

  const toggleStep = async (stepId: string) => {
    const step = roadmap.steps.find((s) => s.id === stepId);
    if (!step) return;

    const newCompleted = !step.completed;

    if (!roadmap) return;
    setRoadmap((prev) => prev ? ({
      ...prev,
      steps: prev.steps.map((s) => (s.id === stepId ? { ...s, completed: newCompleted } : s)),
    }) : prev);

    try {
      await fetch(`/api/roadmap/${roadmap.id}/steps/${stepId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: newCompleted }),
      });
    } catch {
      // Revert if error
    }
  };

  const completedCount = roadmap.steps.filter((s) => s.completed).length;
  const progressPercent = Math.round((completedCount / roadmap.steps.length) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Header with Progress Bar */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-950 p-8 sm:p-10 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
              <Map className="w-3.5 h-3.5" /> Adaptive Study Plan
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {roadmap.title}
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Curated milestones generated directly from your mock interview weak areas and repo critiques.
            </p>
          </div>

          <div className="text-right sm:self-center shrink-0">
            <span className="text-3xl font-black text-indigo-400">{progressPercent}%</span>
            <div className="text-xs text-slate-400">{completedCount} of {roadmap.steps.length} completed</div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Step List */}
      <div className="space-y-4">
        {roadmap.steps.map((step) => {
          const isInterview = step.source === 'interview';
          return (
            <div
              key={step.id}
              className={`p-6 rounded-3xl border transition-all ${
                step.completed
                  ? 'bg-slate-950/50 border-slate-800/60 opacity-80'
                  : 'bg-slate-900/70 border-slate-800 shadow-lg hover:border-indigo-500/40'
              }`}
            >
              <div className="flex items-start gap-4">
                <button
                  onClick={() => toggleStep(step.id)}
                  className="mt-1 text-slate-400 hover:text-white transition-colors"
                >
                  {step.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <Circle className="w-6 h-6 text-slate-600 hover:text-indigo-400" />
                  )}
                </button>

                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm sm:text-base font-bold ${step.completed ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                        {step.topic}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isInterview
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {isInterview ? <Terminal className="w-3 h-3" /> : <GitBranch className="w-3 h-3" />}
                        {isInterview ? 'From Interview' : 'From Repo Critique'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{step.estimatedTime}</span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{step.description}</p>

                  {/* Resource Links */}
                  {step.resourceLinks && step.resourceLinks.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {step.resourceLinks.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-medium text-indigo-300 hover:text-indigo-200 hover:border-indigo-500/50 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {link.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function RoadmapPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-slate-400">Loading personalized roadmap...</div>}>
      <RoadmapContent />
    </Suspense>
  );
}
