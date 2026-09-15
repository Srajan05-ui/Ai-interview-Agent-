'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GitBranch, Globe, GitFork, Sparkles, ArrowRight, CheckCircle2, ShieldCheck, AlertTriangle, Code2, Map } from 'lucide-react';
import { RepoAnalysis } from '@/types';
import { useAuth } from '@/context/AuthContext';

export default function RepoAnalysisPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Mode: "url" or "oauth"
  const [tab, setTab] = useState<'url' | 'oauth'>('url');
  const [repoUrl, setRepoUrl] = useState('https://github.com/facebook/react');
  const [branch, setBranch] = useState('main');
  const [excludeFolders, setExcludeFolders] = useState('node_modules, dist, .next');

  // Analysis State
  const [analysisState, setAnalysisState] = useState<'idle' | 'queued' | 'fetching' | 'analyzing' | 'completed' | 'failed'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [filesCount, setFilesCount] = useState<number>(0);
  const [analysisResult, setAnalysisResult] = useState<RepoAnalysis | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [isSendingToRoadmap, setIsSendingToRoadmap] = useState(false);

  // Connected sample repos for oauth tab
  const repoPrefix = user?.name ? user.name.toLowerCase().replace(/\s+/g, '') : 'candidate';
  const sampleRepos = [
    { name: `${repoPrefix}/distributed-cache-engine`, lang: 'Go', stars: 124, updated: 'Yesterday', url: 'https://github.com/redis/redis' },
    { name: `${repoPrefix}/portfolio-v2`, lang: 'TypeScript', stars: 15, updated: '3 days ago', url: 'https://github.com/vercel/next.js' },
    { name: `${repoPrefix}/microservices-demo`, lang: 'TypeScript', stars: 38, updated: 'Last week', url: 'https://github.com/facebook/react' },
  ];

  const handleStartAnalysis = async (targetUrl?: string) => {
    if (!user) {
      router.push('/login?feature=GitHub%20Repo%20Analysis&redirect=/repo-analysis');
      return;
    }
    const urlToUse = targetUrl || repoUrl;
    if (!urlToUse.trim()) return;

    setAnalysisState('queued');
    setStatusMessage('Enqueuing repository analysis job...');
    setErrorDetails(null);

    try {
      const res = await fetch('/api/repo-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl: urlToUse,
          branch,
        }),
      });

      const data = await res.json();
      if (data.error) {
        setAnalysisState('failed');
        setErrorDetails(data.error.message);
        return;
      }

      const jobId = data.repoAnalysisId;

      // Poll status machine
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        try {
          const pollRes = await fetch(`/api/repo-analysis/${jobId}`);
          if (pollRes.ok) {
            const jobData: RepoAnalysis = await pollRes.json();
            setAnalysisState(jobData.status);
            setStatusMessage(jobData.statusMessage || 'Processing...');
            if (jobData.filesAnalyzedCount) setFilesCount(jobData.filesAnalyzedCount);

            if (jobData.status === 'completed') {
              clearInterval(interval);
              setAnalysisResult(jobData);
            } else if (jobData.status === 'failed') {
              clearInterval(interval);
              setErrorDetails(jobData.errorMessage || 'Analysis failed. Please verify the repository URL.');
            }
          }
        } catch {
          // keep polling
        }

        if (attempts > 30) {
          clearInterval(interval);
          setAnalysisState('failed');
          setErrorDetails('Operation timed out. Please retry.');
        }
      }, 1200);
    } catch (err) {
      console.error('Failed initiating repo analysis:', err);
      setAnalysisState('failed');
      setErrorDetails('Network error contacting analysis service.');
    }
  };

  const handleSendToRoadmap = async () => {
    if (!analysisResult) return;
    setIsSendingToRoadmap(true);
    try {
      const res = await fetch(`/api/repo-analysis/${analysisResult.id}/send-to-roadmap`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.roadmapId) {
        router.push(`/roadmap?id=${data.roadmapId}`);
      } else {
        router.push('/roadmap');
      }
    } catch (e) {
      console.error('Failed sending repo findings to roadmap:', e);
      router.push('/roadmap');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
          <GitBranch className="w-3.5 h-3.5" /> Feature Spec P0
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          GitHub Repository Codebase Analysis
        </h1>
        <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-2xl">
          Evaluate your real portfolio projects before technical interviewers scrutinize them. Get deterministic static checks, secret redaction, and deep AI architecture critiques.
        </p>
      </div>

      {/* Input Selection Card */}
      {analysisState === 'idle' && (
        <div className="p-7 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-2xl space-y-6">
          {/* Tabs */}
          <div className="flex rounded-2xl bg-slate-950 p-1.5 border border-slate-800/80 max-w-md">
            <button
              onClick={() => setTab('url')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                tab === 'url'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-4 h-4" /> Paste Public URL
            </button>
            <button
              onClick={() => setTab('oauth')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                tab === 'oauth'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GitFork className="w-4 h-4" /> Connect GitHub
            </button>
          </div>

          {/* URL Tab Content */}
          {tab === 'url' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">Public Repository URL</label>
                <div className="relative">
                  <input
                    type="text"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/username/project"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-slate-100 outline-none focus:border-emerald-500 transition-colors"
                  />
                  <div className="absolute right-3 top-3 text-[11px] text-slate-500">Public Repos Supported</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Branch</label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Exclude Folders (auto-detected)</label>
                  <input
                    type="text"
                    value={excludeFolders}
                    onChange={(e) => setExcludeFolders(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleStartAnalysis()}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all"
                >
                  <Sparkles className="w-4 h-4" /> Analyze This Repository
                </button>
              </div>
            </div>
          )}

          {/* OAuth Tab Content */}
          {tab === 'oauth' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Select from your connected GitHub repositories:</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> public_repo minimal scope
                </span>
              </div>

              <div className="space-y-2.5">
                {sampleRepos.map((repo) => (
                  <div
                    key={repo.name}
                    onClick={() => {
                      setRepoUrl(repo.url);
                      handleStartAnalysis(repo.url);
                    }}
                    className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all group"
                  >
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                        {repo.name}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
                          {repo.lang}
                        </span>
                        <span>★ {repo.stars}</span>
                        <span>Updated {repo.updated}</span>
                      </div>
                    </div>
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600/20 text-indigo-300 text-xs font-semibold group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      Analyze <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analysis State Machine Progress UI */}
      {(analysisState === 'queued' || analysisState === 'fetching' || analysisState === 'analyzing') && (
        <div className="p-10 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Evaluating Repository Codebase</h2>
            <p className="text-sm text-slate-400">{statusMessage}</p>
          </div>

          {/* Stepper indicator */}
          <div className="flex items-center justify-center gap-3 max-w-md mx-auto pt-4">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" /> Queued
            </div>
            <div className="w-8 h-0.5 bg-slate-800"></div>
            <div className={`flex items-center gap-1.5 text-xs ${analysisState === 'fetching' || analysisState === 'analyzing' ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
              <CheckCircle2 className="w-4 h-4" /> Fetching Tree
            </div>
            <div className="w-8 h-0.5 bg-slate-800"></div>
            <div className={`flex items-center gap-1.5 text-xs ${analysisState === 'analyzing' ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
              <CheckCircle2 className="w-4 h-4" /> LLM Analysis
            </div>
          </div>

          {filesCount > 0 && (
            <div className="text-xs text-slate-400">
              Scanned <span className="text-white font-mono">{filesCount}</span> files (budget capped & secrets redacted).
            </div>
          )}
        </div>
      )}

      {/* Error state */}
      {analysisState === 'failed' && (
        <div className="p-8 rounded-3xl bg-rose-950/20 border border-rose-500/30 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Repository Analysis Failed</h2>
          <p className="text-sm text-slate-300 max-w-md mx-auto">{errorDetails}</p>
          <button
            onClick={() => setAnalysisState('idle')}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            Try Another Repository
          </button>
        </div>
      )}

      {/* Completed Results: Full Repo Scorecard */}
      {analysisState === 'completed' && analysisResult && (
        <div className="space-y-8">
          {/* Top Scorecard Hero */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-950 border border-emerald-500/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
                Repo Scorecard · {analysisResult.repoName}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Project Code Quality Audit
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                Deterministic security, test coverage, and modularity audit completed across {analysisResult.filesAnalyzedCount || 38} files.
              </p>
            </div>

            {/* Overall Score */}
            <div className="p-5 rounded-2xl bg-slate-950/90 border border-emerald-500/40 text-center min-w-[170px]">
              <div className="text-xs font-bold text-slate-400">Overall Score</div>
              <div className="text-4xl font-extrabold text-emerald-400 my-1">
                {analysisResult.overallScore}<span className="text-lg text-slate-500">/100</span>
              </div>
              <div className="text-[11px] text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Production Grade
              </div>
            </div>
          </div>

          {/* Category Breakdown Bars */}
          <div className="p-7 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" /> Category Breakdown
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(analysisResult.categoryScores).map(([key, score]) => {
                const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
                return (
                  <div key={key} className="space-y-1.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-300">{label}</span>
                      <span className={score >= 80 ? 'text-emerald-400' : 'text-amber-400'}>{score}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          score >= 80 ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${score}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Concrete File-Grounded Suggestions */}
          <div className="p-7 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-400" /> File-Referenced Actionable Suggestions
              </h3>
              <span className="text-xs text-slate-400">{analysisResult.suggestions.length} issues identified</span>
            </div>

            <div className="space-y-4">
              {analysisResult.suggestions.map((sug) => (
                <div
                  key={sug.id}
                  className="p-5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                          sug.severity === 'high'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : sug.severity === 'med'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                        }`}
                      >
                        {sug.severity} priority
                      </span>
                      <span className="text-xs font-semibold text-slate-300">{sug.category}</span>
                    </div>

                    <div className="text-xs font-mono text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
                      {sug.filePath} {sug.lineRange ? `(L${sug.lineRange})` : ''}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{sug.description}</p>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                    <span className="text-[11px] font-bold text-emerald-400">Recommended Fix:</span>
                    <p className="text-slate-300">{sug.suggestedFix}</p>
                    {sug.codeSnippet && (
                      <pre className="mt-2 p-2.5 rounded-lg bg-black/60 font-mono text-[11px] text-slate-300 overflow-x-auto">
                        {sug.codeSnippet}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sticky CTA: Send to Roadmap */}
          <div className="sticky bottom-6 z-20 flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-slate-950/95 border border-emerald-500/40 shadow-2xl backdrop-blur-xl">
            <div>
              <div className="text-sm font-bold text-white">Target Repo Weaknesses</div>
              <div className="text-xs text-slate-400">Push weak categories into a step-by-step learning roadmap.</div>
            </div>

            <button
              onClick={handleSendToRoadmap}
              disabled={isSendingToRoadmap}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all"
            >
              <Map className="w-4 h-4" />
              {isSendingToRoadmap ? 'Generating Steps...' : 'Send Weak Areas to My Roadmap'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
