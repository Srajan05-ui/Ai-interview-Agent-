'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Send, Mic, MicOff, Volume2, VolumeX, ShieldAlert, CheckCircle, Terminal, User, List, Camera } from 'lucide-react';
import CodeEditorPanel from '@/components/CodeEditorPanel';
import { Interview, InterviewConfig, InterviewTurn, AntiCheatFlag } from '@/types';
import { safeFetchJson } from '@/lib/api';

function getStarterCode(config: InterviewConfig | null): string | undefined {
  if (!config) return undefined;
  const role = (config.role || '').toLowerCase();
  const isFrontend = role.includes('front') || role.includes('ui') || role.includes('react');
  const isBackend = role.includes('back') || role.includes('node') || role.includes('api') || role.includes('system');
  const isML = role.includes('ml') || role.includes('data') || role.includes('machine') || role.includes('ai');

  if (isFrontend) {
    return `// ====================================================
// STARTER TEMPLATE: Provided by AI Interviewer
// Note: You can modify or completely erase this code.
// ====================================================

// Frontend Technical Challenge: Custom EventEmitter & Debounce
export class EventEmitter {
  private events: Map<string, Function[]> = new Map();

  on(event: string, listener: Function): () => void {
    const list = this.events.get(event) || [];
    list.push(listener);
    this.events.set(event, list);
    return () => {
      const idx = list.indexOf(listener);
      if (idx !== -1) list.splice(idx, 1);
    };
  }

  emit(event: string, ...args: any[]): void {
    const list = this.events.get(event) || [];
    list.forEach((fn) => fn(...args));
  }
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delayMs);
  };
}
`;
  }

  if (isBackend) {
    return `// ====================================================
// STARTER TEMPLATE: Provided by AI Interviewer
// Note: You can modify or completely erase this code.
// ====================================================

// Backend Technical Challenge: Token Bucket Rate Limiter
export class TokenBucketRateLimiter {
  private capacity: number;
  private refillRatePerSecond: number;
  private currentTokens: number;
  private lastRefillTimestamp: number;

  constructor(capacity: number, refillRatePerSecond: number) {
    this.capacity = capacity;
    this.refillRatePerSecond = refillRatePerSecond;
    this.currentTokens = capacity;
    this.lastRefillTimestamp = Date.now();
  }

  tryConsume(tokensRequired: number = 1): boolean {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefillTimestamp) / 1000;
    this.currentTokens = Math.min(
      this.capacity,
      this.currentTokens + elapsedSeconds * this.refillRatePerSecond
    );
    this.lastRefillTimestamp = now;

    if (this.currentTokens >= tokensRequired) {
      this.currentTokens -= tokensRequired;
      return true;
    }
    return false;
  }
}
`;
  }

  if (isML) {
    return `// ====================================================
// STARTER TEMPLATE: Provided by AI Interviewer
// Note: You can modify or completely erase this code.
// ====================================================

// ML Engineering Challenge: Vector Cosine Similarity & Top-K Search
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}
`;
  }

  return undefined;
}

function InterviewSessionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const interviewId = searchParams.get('id') || 'interview-demo';

  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [transcript, setTranscript] = useState<InterviewTurn[]>([]);
  const [questionBank, setQuestionBank] = useState<string[]>([]);
  const [loadingSession, setLoadingSession] = useState(true);

  const [inputText, setInputText] = useState('');
  const [currentCode, setCurrentCode] = useState('');
  const [currentLang, setCurrentLang] = useState('typescript');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [lastFlagNotice, setLastFlagNotice] = useState<string | null>(null);

  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (showCamera) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then(s => {
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      }).catch(e => console.error(e));
    }
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [showCamera]);

  // Load real session from backend
  useEffect(() => {
    async function loadSession() {
      if (!interviewId) return;
      try {
        const res = await safeFetchJson<{ interview?: Interview }>(`/api/interview/${interviewId}`);
        if (res.ok && res.data?.interview) {
          const fetched = res.data.interview;
          if (fetched.transcript && fetched.transcript.length > 0) {
            setTranscript(fetched.transcript);
          }
          if (fetched.config) {
            setConfig(fetched.config);
          }
          if (fetched.questionBank) {
            setQuestionBank(fetched.questionBank);
          }
        } else {
          // Fallback if demo
          setTranscript([
            {
              id: 'turn-1',
              role: 'agent',
              text: "Welcome to your live technical session! Today we'll implement an in-memory key-value store with TTL expiration and O(1) lookups. Could you explain your initial design approach before typing code?",
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      } catch (e) {
        console.error('Failed loading interview session:', e);
      } finally {
        setLoadingSession(false);
      }
    }
    loadSession();
  }, [interviewId]);

  // Auto scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Anti-cheat: Listen for tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const flag: AntiCheatFlag = {
          type: 'tab_switch',
          timestamp: new Date().toISOString(),
          details: 'Candidate navigated away from interview tab.',
        };
        setTabSwitchCount((prev) => prev + 1);
        setLastFlagNotice('Integrity monitor: Tab switch event recorded.');
        setTimeout(() => setLastFlagNotice(null), 4000);

        // Notify backend in background
        fetch(`/api/interview/${interviewId}/answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ antiCheatFlag: flag, text: '' }),
        }).catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [interviewId]);

  // Voice Speech-To-Text simulation / Web Speech API
  const toggleVoiceInput = () => {
    if (!isVoiceActive) {
      setIsVoiceActive(true);
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRec();
        recognition.continuous = false;
        recognition.interimResults = true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
          const spoken = event.results[0][0].transcript;
          setInputText(spoken);
        };
        recognition.onend = () => setIsVoiceActive(false);
        recognition.start();
      } else {
        // Fallback simulation
        setTimeout(() => {
          setInputText((prev) => (prev ? prev + ' ' : '') + 'I propose using a doubly linked list with a hash map.');
          setIsVoiceActive(false);
        }, 2000);
      }
    } else {
      setIsVoiceActive(false);
    }
  };

  // Text-To-Speech
  const speakText = (text: string) => {
    if (ttsEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSubmitAnswer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !currentCode.trim()) return;

    setIsSubmitting(true);
    const candidateText = inputText;
    setInputText('');

    const newCandidateTurn: InterviewTurn = {
      id: `turn-${Date.now()}`,
      role: 'candidate',
      text: candidateText,
      codeSnapshot: currentCode,
      language: currentLang,
      timestamp: new Date().toISOString(),
    };

    setTranscript((prev) => [...prev, newCandidateTurn]);

    try {
      const res = await safeFetchJson<{ nextQuestion?: string }>(
        `/api/interview/${interviewId}/answer`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: candidateText,
            codeSnapshot: currentCode,
            language: currentLang,
          }),
        }
      );

      if (res.ok && res.data?.nextQuestion) {
        const nextQuestion = res.data.nextQuestion;
        const agentTurn: InterviewTurn = {
          id: `turn-${Date.now() + 1}`,
          role: 'agent',
          text: nextQuestion,
          timestamp: new Date().toISOString(),
        };
        setTranscript((prev) => [...prev, agentTurn]);
        speakText(nextQuestion);
      }
    } catch (err) {
      console.error('Answer submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteInterview = async () => {
    if (!confirm('Are you ready to submit and conclude this interview? The AI will grade your transcript and code.')) return;
    setIsSubmitting(true);
    try {
      const res = await safeFetchJson<{ scorecardId?: string }>(
        `/api/interview/${interviewId}/complete`,
        {
          method: 'POST',
        }
      );
      if (res.ok && res.data?.scorecardId) {
        router.push(`/interview/scorecard/${res.data.scorecardId}`);
      } else {
        router.push(`/interview/scorecard/${interviewId}`);
      }
    } catch (e) {
      console.error('Completion error:', e);
      router.push(`/interview/scorecard/${interviewId}`);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4 relative">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-transparent to-teal-900/10 pointer-events-none rounded-3xl" />

      {/* Top Banner with status & anti-cheat */}
      <div className="flex items-center justify-between px-5 py-3 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700/50 shadow-lg shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute"></span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 relative"></span>
            <span className="text-xs font-bold text-emerald-400 tracking-wide uppercase ml-1">Live Session Active</span>
          </div>
          <span className="text-xs text-slate-500 hidden sm:inline">|</span>
          <span className="text-xs text-slate-300 font-medium hidden sm:inline">
            {config ? `${config.companyStyle} · ${config.experienceLevel} ${config.role} (${config.mode})` : 'Technical Interview Session'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Integrity Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
            <ShieldAlert className={`w-3.5 h-3.5 ${tabSwitchCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`} />
            <span>Anti-Cheat: {tabSwitchCount === 0 ? 'Clean' : `${tabSwitchCount} tab switch(es)`}</span>
          </div>

          {/* Camera Toggle */}
          <button
            onClick={() => setShowCamera(!showCamera)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title={showCamera ? 'Disable Camera' : 'Enable Camera'}
          >
            <Camera className={`w-4 h-4 ${showCamera ? 'text-emerald-400' : 'text-slate-500'}`} />
          </button>

          {/* TTS Toggle */}
          <button
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title={ttsEnabled ? 'Mute AI voice' : 'Enable AI voice'}
          >
            {ttsEnabled ? <Volume2 className="w-4 h-4 text-indigo-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Conclude Session CTA */}
          <button
            onClick={handleCompleteInterview}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all"
          >
            <CheckCircle className="w-3.5 h-3.5" /> End & Grade Session
          </button>
        </div>
      </div>

      {/* Flag Alert Toast */}
      {lastFlagNotice && (
        <div className="bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs px-4 py-2 rounded-xl flex items-center gap-2 animate-bounce">
          <ShieldAlert className="w-4 h-4 text-amber-400" /> {lastFlagNotice}
        </div>
      )}

      {/* Planned AI Topics */}
      {questionBank && questionBank.length > 0 && (
        <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-sky-500/20 p-4 shrink-0 shadow-lg shadow-sky-900/20 overflow-x-auto custom-scrollbar z-10 relative">
           <h4 className="text-[11px] font-bold uppercase tracking-wider text-sky-400 mb-3 flex items-center gap-2">
             <List className="w-4 h-4" /> Planned AI Topics (Resume-Driven)
           </h4>
           <div className="flex gap-2">
             {questionBank.map((q, i) => (
               <span key={i} className="px-3 py-1.5 rounded-lg bg-sky-500/10 text-[11px] text-sky-100 whitespace-nowrap border border-sky-500/20 hover:bg-sky-500/20 hover:border-sky-500/40 transition-colors cursor-default shadow-sm">
                 {q.length > 40 ? q.slice(0, 40) + '...' : q}
               </span>
             ))}
           </div>
        </div>
      )}

      {/* Main Split Interface */}
      <div className={`flex-1 grid grid-cols-1 ${config?.mode === 'Live Coding' ? 'lg:grid-cols-2' : ''} gap-4 min-h-0`}>
        {/* Left Column: Adaptive Conversation Stream */}
        <div className="flex flex-col bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="px-4 py-2.5 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" /> Adaptive Interview Transcript
            </span>
            <span className="text-[11px] text-slate-500">{transcript.length} turns</span>
          </div>

          {showCamera && (
            <div className="px-4 py-2 border-b border-slate-800 bg-slate-950 flex justify-center">
              <video ref={videoRef} autoPlay playsInline muted className="w-48 h-32 object-cover rounded-lg border border-slate-800 transform scale-x-[-1]" />
            </div>
          )}

          {/* Scrollable messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-5 scroll-smooth">
            {transcript.map((turn, idx) => {
              const isAgent = turn.role === 'agent';
              return (
                <div
                  key={turn.id}
                  className={`flex gap-3 animate-in slide-in-from-bottom-2 fade-in duration-300 ${isAgent ? 'justify-start' : 'justify-end'}`}
                  style={{ animationFillMode: 'both', animationDelay: `${idx * 50}ms` }}
                >
                  {isAgent && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shrink-0 shadow-md">
                      <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                        <Terminal className="w-4 h-4 text-indigo-400" />
                      </div>
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                      isAgent
                        ? 'bg-slate-950/90 border border-slate-800/90 text-slate-200 shadow-sm'
                        : 'bg-indigo-600 text-white rounded-br-none shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <span className={`text-[11px] font-bold ${isAgent ? 'text-indigo-400' : 'text-indigo-200'}`}>
                        {isAgent ? 'AI Interviewer' : 'Candidate'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="whitespace-pre-wrap">{turn.text}</div>

                    {turn.codeSnapshot && (
                      <div className="mt-2.5 p-2 rounded-lg bg-black/40 border border-white/10 font-mono text-xs text-slate-300 overflow-x-auto max-h-28">
                        <div className="text-[10px] text-slate-400 mb-1">Attached Code Snapshot:</div>
                        <pre>{turn.codeSnapshot.slice(0, 160)}...</pre>
                      </div>
                    )}
                  </div>

                  {!isAgent && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 text-slate-300">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={transcriptEndRef} />
          </div>

          {/* Input Box */}
          <form onSubmit={handleSubmitAnswer} className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`p-2.5 rounded-xl border transition-all ${
                isVoiceActive
                  ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Speech-To-Text"
            >
              {isVoiceActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Explain your approach, ask clarifying questions, or answer..."
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors"
            />

            <button
              type="submit"
              disabled={isSubmitting || (!inputText.trim() && !currentCode.trim())}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 shadow-md shadow-indigo-600/20 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right Column: In-browser Live Code Editor */}
        {config?.mode === 'Live Coding' && (
          <div className="flex flex-col h-full gap-4 min-w-0 z-10 relative">
            <div className="flex-1 min-h-0">
              <CodeEditorPanel
                key={config ? `${config.role}-${config.mode}` : 'default-editor'}
                initialCode={getStarterCode(config)}
                onChange={(code) => setCurrentCode(code)}
                onRun={(code, lang) => {
                  setCurrentCode(code);
                  setCurrentLang(lang);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InterviewSessionPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-slate-400">Loading interview session...</div>}>
      <InterviewSessionContent />
    </Suspense>
  );
}
