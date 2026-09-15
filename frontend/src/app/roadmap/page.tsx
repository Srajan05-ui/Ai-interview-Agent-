'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Map, CheckCircle2, Circle, Clock, ExternalLink, Sparkles, Terminal, GitBranch } from 'lucide-react';
import { Roadmap, RoadmapStep } from '@/types';

function RoadmapContent() {
  const searchParams = useSearchParams();
  const queryId = searchParams.get('id');

  const [roadmap, setRoadmap] = useState<Roadmap>({
    id: queryId || 'roadmap-demo',
    userId: 'user-demo-1',
    title: 'Senior Engineering Interview Mastery & System Hardening',
    createdAt: new Date().toISOString(),
    steps: [
      {
        id: 'step-1',
        topic: 'LRU Cache Eviction & Concurrency Controls',
        description: 'Practice multi-threaded lock striping and lock-free eviction queues for high-throughput in-memory caching.',
        estimatedTime: '2 days',
        completed: true,
        source: 'interview',
        resourceLinks: [
          { title: 'Concurrent LRU Cache Design', url: 'https://github.com/donnemartin/system-design-primer' },
          { title: 'Go Sync & RWMutex Guide', url: 'https://go.dev/tour/concurrency/9' },
        ],
      },
      {
        id: 'step-2',
        topic: 'Defensive Unit Testing & Mocking External I/O',
        description: 'Set up Vitest/Jest test harness to simulate network timeouts, upstream 503s, and boundary validation.',
        estimatedTime: '3 days',
        completed: true,
        source: 'repo_analysis',
        resourceLinks: [
          { title: 'The Practical Test Pyramid by Martin Fowler', url: 'https://martinfowler.com/articles/practical-test-pyramid.html' },
        ],
      },
      {
        id: 'step-3',
        topic: 'Distributed Consensus & Raft Leader Election',
        description: 'Study how distributed data stores handle network partitions, split-brain states, and log replication.',
        estimatedTime: '4 days',
        completed: false,
        source: 'interview',
        resourceLinks: [
          { title: 'The Secret Lives of Data (Raft Visualization)', url: 'https://thesecretlivesofdata.com/raft/' },
        ],
      },
      {
        id: 'step-4',
        topic: 'Automated GitHub Actions CI/CD Pipeline',
        description: 'Implement workflow YAML verifying automated linting, typescript checking, and automated coverage reports on pull requests.',
        estimatedTime: '1 day',
        completed: false,
        source: 'repo_analysis',
        resourceLinks: [
          { title: 'GitHub Actions Documentation', url: 'https://docs.github.com/en/actions' },
        ],
      },
      {
        id: 'step-5',
        topic: 'Database Query Optimization & Composite Indexing',
        description: 'Analyze EXPLAIN ANALYZE query plans in PostgreSQL/MySQL to eliminate full table scans and reduce p99 latency.',
        estimatedTime: '2 days',
        completed: false,
        source: 'interview',
        resourceLinks: [
          { title: 'Use The Index, Luke!', url: 'https://use-the-index-luke.com/' },
        ],
      },
    ],
  });

  useEffect(() => {
    if (queryId) {
      fetch(`/api/roadmap/${queryId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.steps) setRoadmap(data);
        })
        .catch(() => {});
    }
  }, [queryId]);

  const toggleStep = async (stepId: string) => {
    const step = roadmap.steps.find((s) => s.id === stepId);
    if (!step) return;

    const newCompleted = !step.completed;

    // Optimistic UI update
    setRoadmap((prev) => ({
      ...prev,
      steps: prev.steps.map((s) => (s.id === stepId ? { ...s, completed: newCompleted } : s)),
    }));

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
