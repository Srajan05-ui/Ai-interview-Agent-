'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Award, ArrowRight, CheckCircle2, AlertCircle, Quote, Sparkles, Map } from 'lucide-react';
import { Scorecard } from '@/types';
import { safeFetchJson } from '@/lib/api';

export default function ScorecardPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingRoadmap, setSendingRoadmap] = useState(false);

  useEffect(() => {
    async function loadScorecard() {
      try {
        const res = await safeFetchJson<Scorecard>(`/api/interview/${id}/scorecard`);
        if (res.ok && res.data) {
          setScorecard(res.data);
        } else {
          // Fallback demo scorecard if newly tested
          setScorecard({
            id: 'scorecard-demo',
            interviewId: id,
            overallScore: 85,
            rubricScores: {
              'Problem Solving & Logic': 88,
              'System Design & Architecture': 82,
              'Code Quality & Clean Architecture': 86,
              'Communication & Verbalization': 90,
              'Edge-Case Handling & Defensive Coding': 74,
            },
            strongAreas: [
              'Clear verbalization of trade-offs between space and time complexity.',
              'Clean separation of concerns with modular classes and types.',
              'Pragmatic handling of capacity and eviction conditions.',
            ],
            weakAreas: [
              'Concurrency edge cases: race conditions during simultaneous writes.',
              'Defensive input validation when capacity is initialized to non-positive integers.',
            ],
            citedFeedback: [
              {
                topic: 'Data Structure Choice',
                severity: 'positive',
                text: 'Candidate promptly chose Doubly Linked List with Hash Map for guaranteed O(1) operations, citing key lookups accurately.',
                transcriptTurnRef: 'turn-1',
              },
              {
                topic: 'Eviction Edge Cases',
                severity: 'needs_work',
                text: 'In the live code snapshot, duplicate key insertion did not refresh the key to the head of the eviction list before checking capacity.',
                transcriptTurnRef: 'turn-3',
              },
            ],
            createdAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('Failed fetching scorecard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadScorecard();
  }, [id]);

  const handleSendToRoadmap = async () => {
    setSendingRoadmap(true);
    try {
      const res = await safeFetchJson<{ roadmapId?: string }>('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: 'scorecard',
          sourceId: scorecard?.id || id,
        }),
      });
      if (res.ok && res.data?.roadmapId) {
        router.push(`/roadmap?id=${res.data.roadmapId}`);
      }
    } catch (e) {
      console.error('Failed sending to roadmap:', e);
      router.push('/roadmap');
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <div className="text-slate-400 font-medium">Synthesizing interview rubric & citations...</div>
      </div>
    );
  }

  if (!scorecard) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-white mb-2">Scorecard Not Found</h2>
        <Link href="/" className="text-indigo-400 hover:underline">Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Header with Overall Score Gauge */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-950 p-8 sm:p-10 shadow-2xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
              <Award className="w-3.5 h-3.5" /> Performance Scorecard
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Evaluation & Candidate Feedback
            </h1>
            <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-xl">
              Session evaluated against senior engineering rubrics with turn-by-turn citations and actionable study recommendations.
            </p>
          </div>

          {/* Large Overall Score Meter */}
          <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-slate-950/80 border border-indigo-500/30 shadow-2xl shrink-0 text-center min-w-[200px]">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Overall Score</span>
            <div className="text-5xl font-black bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
              {scorecard.overallScore}
              <span className="text-xl text-slate-500 font-normal">/100</span>
            </div>
            <div className="text-xs font-semibold text-emerald-400 mt-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              {scorecard.overallScore >= 80 ? 'Interview Ready' : 'Needs Preparation'}
            </div>
          </div>
        </div>
      </div>

      {/* Rubric Breakdown Bars */}
      <div className="p-7 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" /> Rubric Category Performance
        </h2>

        <div className="space-y-4">
          {Object.entries(scorecard.rubricScores).map(([topic, score]) => (
            <div key={topic} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-300">{topic}</span>
                <span className={score >= 80 ? 'text-emerald-400' : 'text-amber-400'}>{score}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    score >= 80
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : 'bg-gradient-to-r from-amber-500 to-orange-400'
                  }`}
                  style={{ width: `${score}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strong vs Weak Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strong Areas */}
        <div className="p-6 rounded-3xl bg-emerald-950/20 border border-emerald-500/30 space-y-4">
          <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Demonstrated Strengths
          </h3>
          <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
            {scorecard.strongAreas.map((str, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0"></span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weak Areas */}
        <div className="p-6 rounded-3xl bg-amber-950/20 border border-amber-500/30 space-y-4">
          <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> Key Areas for Improvement
          </h3>
          <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
            {scorecard.weakAreas.map((weak, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0"></span>
                <span>{weak}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Cited Transcript Feedback */}
      <div className="p-7 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-5">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Quote className="w-5 h-5 text-indigo-400" /> Evidence-Grounded Feedback (Transcript Cited)
        </h2>
        <div className="space-y-3">
          {scorecard.citedFeedback.map((fb, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-300">{fb.topic}</span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      fb.severity === 'positive'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {fb.severity === 'positive' ? 'Observed Strength' : 'Opportunity to Improve'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300">{fb.text}</p>
              </div>

              {fb.transcriptTurnRef && (
                <div className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 shrink-0 self-start sm:self-center">
                  ref: {fb.transcriptTurnRef}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sticky Bottom Call-to-Action */}
      <div className="sticky bottom-6 z-20 flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-slate-950/95 border border-indigo-500/40 shadow-2xl backdrop-blur-xl">
        <div>
          <div className="text-sm font-bold text-white">Convert Weak Areas into a Study Plan</div>
          <div className="text-xs text-slate-400">Generate targeted practice problems and tutorials.</div>
        </div>

        <button
          onClick={handleSendToRoadmap}
          disabled={sendingRoadmap}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
        >
          <Map className="w-4 h-4" />
          {sendingRoadmap ? 'Generating Roadmap...' : 'Send Weak Areas to My Roadmap'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
