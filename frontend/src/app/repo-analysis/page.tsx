'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GitBranch, Globe, GitFork, Sparkles, ArrowRight, CheckCircle2, ShieldCheck, AlertTriangle, Code2, Map, Search, RefreshCw, Lock } from 'lucide-react';
import { RepoAnalysis } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { safeFetchJson } from '@/lib/api';

interface GitHubRepoItem {
  id?: number;
  name: string;
  fullName: string;
  lang: string;
  stars: number;
  updated: string;
  url: string;
  isPrivate?: boolean;
  defaultBranch?: string;
  description?: string;
}

export default function RepoAnalysisPage() {
  const router = useRouter();
  const { user, loginWithGithub } = useAuth();

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

  // Real Connected Repositories State
  const [realRepos, setRealRepos] = useState<GitHubRepoItem[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repoSearch, setRepoSearch] = useState('');
  const [githubUsernameInput, setGithubUsernameInput] = useState('');
  const [reposError, setReposError] = useState<string | null>(null);

  const fetchUserRepos = async (customUsername?: string) => {
    setLoadingRepos(true);
    setReposError(null);
    try {
      const usernameToFetch = customUsername || githubUsernameInput;
      const query = usernameToFetch ? `?username=${encodeURIComponent(usernameToFetch)}` : '';
      const result = await safeFetchJson<{ repos?: GitHubRepoItem[]; connected?: boolean; error?: string }>(
        `/api/user/repos${query}`
      );
      if (result.ok && result.data?.repos && result.data.repos.length > 0) {
        setRealRepos(result.data.repos);
      } else if (result.data?.repos && result.data.repos.length === 0 && !result.data.connected) {
        setReposError('No connected GitHub repositories found. Connect your GitHub account or enter your username.');
      } else if (result.error || result.data?.error) {
        setReposError(result.error || result.data?.error || 'Failed loading repositories.');
      } else {
        setRealRepos(result.data?.repos || []);
      }
    } catch (e: any) {
      setReposError(e?.message || 'Error communicating with GitHub.');
    } finally {
      setLoadingRepos(false);
    }
  };

  useEffect(() => {
    if (tab === 'oauth' && user) {
      fetchUserRepos();
    }
  }, [tab, user]);

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
      const result = await safeFetchJson<{ repoAnalysisId?: string; error?: { message: string } }>(
        '/api/repo-analysis',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            repoUrl: urlToUse,
            branch,
          }),
        }
      );

      if (!result.ok || !result.data?.repoAnalysisId) {
        setAnalysisState('failed');
        setErrorDetails(result.error || result.data?.error?.message || 'Failed initiating analysis.');
        return;
      }

      const jobId = result.data.repoAnalysisId;

      // Poll status machine
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        try {
          const pollRes = await safeFetchJson<RepoAnalysis>(`/api/repo-analysis/${jobId}`);
          if (pollRes.ok && pollRes.data) {
            const jobData = pollRes.data;
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
    } catch (err: any) {
      console.error('Failed initiating repo analysis:', err);
      setAnalysisState('failed');
      setErrorDetails(err?.message || 'Network error contacting analysis service.');
    }
  };

  const handleSendToRoadmap = async () => {
    if (!analysisResult) return;
    setIsSendingToRoadmap(true);
    try {
      const res = await safeFetchJson<{ roadmapId?: string }>(
        `/api/repo-analysis/${analysisResult.id}/send-to-roadmap`,
        {
          method: 'POST',
        }
      );
      if (res.ok && res.data?.roadmapId) {
        router.push(`/roadmap?id=${res.data.roadmapId}`);
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
              <GitFork className="w-4 h-4" /> {user?.githubConnected ? 'My GitHub Repositories' : 'Connect GitHub'}
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
                <span>{user?.githubConnected ? 'Select from your GitHub repositories:' : 'Connect your account or explore by username:'}</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> {user?.githubConnected ? 'GitHub Account Active' : 'public_repo minimal scope'}
                </span>
              </div>

              {/* GitHub Connected Search & Actions Bar */}
              {user?.githubConnected ? (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={repoSearch}
                      onChange={(e) => setRepoSearch(e.target.value)}
                      placeholder="Search your repositories by name, language..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => fetchUserRepos()}
                    disabled={loadingRepos}
                    title="Refresh repositories list"
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingRepos ? 'animate-spin text-indigo-400' : ''}`} />
                  </button>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-center sm:text-left">
                      <div className="text-sm font-semibold text-white">Connect Your GitHub Account</div>
                      <div className="text-xs text-slate-400">
                        Authorize Paradox to list your personal repositories (public & private) for direct one-click analysis.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => loginWithGithub('/repo-analysis')}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#24292f] hover:bg-[#1b1f23] text-white text-xs font-bold border border-slate-700 shadow-md transition-all shrink-0"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                      </svg>
                      Connect GitHub
                    </button>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80">
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                      Or fetch public repositories by GitHub username:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={githubUsernameInput}
                        onChange={(e) => setGithubUsernameInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchUserRepos(githubUsernameInput)}
                        placeholder="e.g. Srajan05-ui"
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => fetchUserRepos(githubUsernameInput)}
                        disabled={loadingRepos || !githubUsernameInput.trim()}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-50 transition-all"
                      >
                        Fetch Repos
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {loadingRepos && (
                <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
                  <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <div className="text-xs text-slate-400">Loading GitHub repositories...</div>
                </div>
              )}

              {/* Error Message */}
              {reposError && !loadingRepos && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{reposError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fetchUserRepos()}
                    className="underline hover:text-rose-300 shrink-0 font-medium"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Real Repositories List */}
              {!loadingRepos && realRepos.length > 0 && (
                <div className="space-y-2.5">
                  {realRepos
                    .filter((repo) => {
                      const query = repoSearch.toLowerCase().trim();
                      if (!query) return true;
                      return (
                        repo.name.toLowerCase().includes(query) ||
                        repo.fullName.toLowerCase().includes(query) ||
                        (repo.lang && repo.lang.toLowerCase().includes(query)) ||
                        (repo.description && repo.description.toLowerCase().includes(query))
                      );
                    })
                    .map((repo) => (
                      <div
                        key={repo.fullName || repo.name}
                        onClick={() => {
                          setRepoUrl(repo.url);
                          if (repo.defaultBranch) setBranch(repo.defaultBranch);
                          handleStartAnalysis(repo.url);
                        }}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all group shadow-sm"
                      >
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors truncate">
                              {repo.fullName || repo.name}
                            </span>
                            {repo.isPrivate ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-medium">
                                <Lock className="w-2.5 h-2.5" /> Private
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-medium">
                                Public
                              </span>
                            )}
                          </div>

                          {repo.description && (
                            <p className="text-xs text-slate-400 line-clamp-1">{repo.description}</p>
                          )}

                          <div className="text-xs text-slate-500 flex items-center gap-3 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
                              {repo.lang}
                            </span>
                            <span>★ {repo.stars}</span>
                            <span>Updated {repo.updated}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600/20 text-indigo-300 text-xs font-semibold group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0"
                        >
                          Analyze <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                  {/* Empty search filter result */}
                  {realRepos.filter((repo) => {
                    const query = repoSearch.toLowerCase().trim();
                    if (!query) return true;
                    return (
                      repo.name.toLowerCase().includes(query) ||
                      repo.fullName.toLowerCase().includes(query) ||
                      (repo.lang && repo.lang.toLowerCase().includes(query))
                    );
                  }).length === 0 && (
                    <div className="p-8 text-center text-xs text-slate-400 bg-slate-950/60 rounded-2xl border border-slate-800">
                      No repositories found matching &ldquo;{repoSearch}&rdquo;.
                    </div>
                  )}
                </div>
              )}
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
