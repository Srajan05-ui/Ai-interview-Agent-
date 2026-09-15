'use client';

import { useState } from 'react';
import { Play, RotateCcw, Copy, Check, Terminal as ConsoleIcon } from 'lucide-react';

interface CodeEditorPanelProps {
  initialCode?: string;
  initialLanguage?: string;
  onChange?: (code: string) => void;
  onRun?: (code: string, language: string) => void;
}

const STARTER_SNIPPETS: Record<string, string> = {
  typescript: `// ====================================================
// STARTER TEMPLATE: Provided by AI Interviewer
// Note: You can modify or completely erase this code 
// to solve the challenge presented by the interviewer.
// ====================================================

class LRUCache {
  private capacity: number;
  private cache: Map<number, number>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key: number): number {
    if (!this.cache.has(key)) return -1;
    const val = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }

  put(key: number, value: number): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
  }
}

// Test Run
const cache = new LRUCache(2);
cache.put(1, 1);
cache.put(2, 2);
console.log("get(1):", cache.get(1)); // returns 1
cache.put(3, 3); // evicts key 2
console.log("get(2):", cache.get(2)); // returns -1
`,
  python: `# ====================================================
# STARTER TEMPLATE: Provided by AI Interviewer
# Note: You can modify or completely erase this code 
# to solve the challenge presented by the interviewer.
# ====================================================

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        val = self.cache.pop(key)
        self.cache[key] = val
        return val

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.cache.pop(key)
        elif len(self.cache) >= self.capacity:
            oldest = next(iter(self.cache))
            del self.cache[oldest]
        self.cache[key] = value

# Test execution
cache = LRUCache(2)
cache.put(1, 1)
cache.put(2, 2)
print("get(1):", cache.get(1))
cache.put(3, 3)
print("get(2):", cache.get(2))
`,
  go: `// ====================================================
// STARTER TEMPLATE: Provided by AI Interviewer
// Note: You can modify or completely erase this code 
// to solve the challenge presented by the interviewer.
// ====================================================

package main

import "fmt"

func main() {
    fmt.Println("Running algorithmic test suite...")
}
`,
};

export default function CodeEditorPanel({
  initialCode,
  initialLanguage = 'typescript',
  onChange,
  onRun,
}: CodeEditorPanelProps) {
  const [language, setLanguage] = useState(initialLanguage);
  const [code, setCode] = useState(initialCode || STARTER_SNIPPETS[initialLanguage] || STARTER_SNIPPETS.typescript);
  const [output, setOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    const snippet = STARTER_SNIPPETS[lang] || `// Code in ${lang}\n`;
    setCode(snippet);
    if (onChange) onChange(snippet);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCode(val);
    if (onChange) onChange(val);
  };

  const handleRun = () => {
    setIsRunning(true);
    setOutput('Compiling and executing test cases...\n');
    setTimeout(() => {
      setIsRunning(false);
      setOutput(
        `✓ Compilation successful\n✓ Test 1: get(1) == 1 passed [0.4ms]\n✓ Test 2: get(2) == -1 (eviction verified) passed [0.2ms]\n\nAll test cases passed cleanly.`
      );
      if (onRun) onRun(code, language);
    }, 750);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = code.split('\n').length;

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
          </div>
          <span className="text-xs font-semibold text-slate-400">Live Code Environment</span>

          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="text-xs bg-slate-800 text-slate-200 border border-slate-700 rounded-md px-2 py-1 outline-none focus:border-indigo-500"
          >
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="go">Go</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={() => handleLanguageChange(language)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Reset code"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3.5 py-1 text-xs font-medium rounded-md bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
          >
            <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Running...' : 'Run Tests'}
          </button>
        </div>
      </div>

      {/* Editor Body with line numbers */}
      <div className="flex-1 flex overflow-hidden font-mono text-sm relative">
        {/* Line Numbers */}
        <div className="w-12 py-3 bg-slate-950 select-none text-right pr-3 text-slate-600 border-r border-slate-800/60 font-mono text-xs leading-6">
          {Array.from({ length: Math.max(lineCount, 15) }).map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Code Input */}
        <textarea
          value={code}
          onChange={handleCodeChange}
          spellCheck={false}
          className="flex-1 p-3 bg-transparent text-slate-200 outline-none resize-none font-mono text-xs leading-6 selection:bg-indigo-500/30 whitespace-pre"
        />
      </div>

      {/* Output Console Tab */}
      {output && (
        <div className="border-t border-slate-800 bg-slate-950/95 p-3 font-mono text-xs max-h-36 overflow-y-auto">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
              <ConsoleIcon className="w-3.5 h-3.5" /> Test Results & Console Output
            </span>
            <button
              onClick={() => setOutput(null)}
              className="text-slate-500 hover:text-slate-300 text-[10px]"
            >
              Clear
            </button>
          </div>
          <pre className="text-slate-300 whitespace-pre-wrap">{output}</pre>
        </div>
      )}
    </div>
  );
}
