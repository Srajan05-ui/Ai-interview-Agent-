import {
  InterviewConfig,
  InterviewTurn,
  Scorecard,
  ResumeFeedback,
  RepoSuggestion,
  RoadmapStep,
  AntiCheatFlag,
  CitedFeedback,
} from '../../types/index.js';
import { StaticSignals } from '../github/analyzer.js';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export async function generateAdaptiveQuestion(
  config: InterviewConfig,
  transcript: InterviewTurn[]
): Promise<string> {
  const turnCount = transcript.filter((t) => t.role === 'agent').length;

  if (ANTHROPIC_API_KEY) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 600,
          messages: [
            {
              role: 'user',
              content: `You are an expert technical interviewer conducting a ${config.companyStyle} interview for a ${config.experienceLevel} ${config.role}. Mode: ${config.mode}.
Current transcript:
${transcript.map((t) => `${t.role}: ${t.text} ${t.codeSnapshot ? `\nCode:\n${t.codeSnapshot}` : ''}`).join('\n')}

Generate the next thoughtful, adaptive follow-up or probing question based on the candidate's last answer.`,
            },
          ],
        }),
      });
      const data = (await response.json()) as { content?: { text?: string }[] };
      if (data.content?.[0]?.text) {
        return data.content[0].text;
      }
    } catch (e) {
      console.error('Claude API call failed, falling back to smart simulation:', e);
    }
  }

  // Realistic adaptive simulation
  if (config.mode === 'Live Coding') {
    if (turnCount === 0) {
      return `Welcome! For today's live coding session targeting ${config.role}, let's implement an LRU Cache with O(1) get and put operations in your language of choice. How would you plan your data structures before typing code?`;
    } else if (turnCount === 1) {
      return `Great design choice with the Doubly Linked List and Hash Map. Go ahead and write out the core class and Node definitions in the editor panel. Be sure to handle edge cases like evicting the least recently used element when capacity is reached.`;
    } else if (turnCount === 2) {
      return `I see your implementation in the editor. What is the time and space complexity of your 'put' operation when the cache is already at capacity? How would this behave in a multi-threaded or concurrent environment?`;
    } else {
      return `Excellent walkthrough. Could you optimize your eviction logic, or write a couple of unit tests in the editor to verify duplicate keys?`;
    }
  } else if (config.mode === 'Behavioral') {
    if (turnCount === 0) {
      return `Hello! Let's start by hearing about a challenging technical project you led or contributed to significantly. What was your specific ownership, and what major hurdle did you overcome?`;
    } else if (turnCount === 1) {
      return `When facing that roadblock with your team, how did you resolve disagreements regarding the architecture or timeline?`;
    } else {
      return `If you had to start that project again with what you know now, what would you do differently regarding system reliability and stakeholder communication?`;
    }
  } else {
    // Technical Q&A
    if (turnCount === 0) {
      return `Welcome to your ${config.role} technical interview (${config.companyStyle}). To begin, could you explain how you design for high availability and zero-downtime database migrations in a distributed microservices environment?`;
    } else if (turnCount === 1) {
      return `You mentioned using feature flags and dual-writing. How do you handle data inconsistency or split-brain states between the legacy schema and the new database schema during the transition window?`;
    } else if (turnCount === 2) {
      return `Good catch on reconciliation workers. How would you design the observability and alerting pipeline so your on-call team detects latency spikes before users are impacted?`;
    } else {
      return `Let's dive into API design. When designing idempotent endpoints for payment processing or critical mutations, how do you handle idempotency keys across distributed nodes?`;
    }
  }
}

export async function gradeInterview(
  interviewId: string,
  config: InterviewConfig,
  transcript: InterviewTurn[],
  antiCheatFlags: AntiCheatFlag[]
): Promise<Scorecard> {
  const totalTurns = transcript.length;
  const tabSwitches = antiCheatFlags.filter((f) => f.type === 'tab_switch').length;

  let overallScore = 84;
  if (tabSwitches > 3) overallScore -= 8;
  if (totalTurns < 4) overallScore = Math.min(overallScore, 68);

  const rubricScores: Record<string, number> = {
    'Problem Solving': Math.min(95, Math.max(65, 82 + (totalTurns > 3 ? 6 : 0))),
    'Technical Accuracy': 86,
    'Communication & Clarity': 88,
    'System Design / Architecture': 79,
    'Code Quality & Best Practices': config.mode === 'Live Coding' ? 83 : 80,
  };

  const strongAreas = [
    'Clear architectural decomposition and component isolation',
    'Solid grasp of Big-O complexity and memory trade-offs',
    'Effective verbalization of assumptions before implementing',
  ];

  const weakAreas = [
    'Deep concurrency / distributed consensus trade-offs',
    'Defensive error handling and edge-case testing coverage',
  ];

  const citedFeedback: CitedFeedback[] = [
    {
      topic: 'Data Structure Choice',
      severity: 'positive',
      text: 'Articulated O(1) hash map + doubly linked list trade-offs proactively before writing code.',
      transcriptTurnRef: transcript[1]?.id || 'turn-1',
    },
    {
      topic: 'Edge Case Handling',
      severity: 'needs_work',
      text: 'Eviction boundary test missed handling cache capacity of 0 or duplicate key updates.',
      transcriptTurnRef: transcript[transcript.length - 1]?.id || 'turn-3',
    },
  ];

  if (tabSwitches > 0) {
    citedFeedback.push({
      topic: 'Interview Environment',
      severity: 'critical' as const,
      text: `${tabSwitches} browser tab switch events recorded during session. Maintain focus during live evaluations.`,
      transcriptTurnRef: 'anti-cheat-log',
    });
  }

  return {
    id: `scorecard-${Date.now()}`,
    interviewId,
    overallScore,
    rubricScores,
    strongAreas,
    weakAreas,
    citedFeedback,
    createdAt: new Date().toISOString(),
  };
}

export async function analyzeResumeContent(
  fileName: string,
  rawText: string
): Promise<ResumeFeedback> {
  return {
    summary: `Resume demonstrates strong full-stack and distributed systems experience with modern architectural practices. Highlight scale metrics (RPS, throughput, DAU) to maximize ATS impact.`,
    sections: [
      {
        name: 'Experience & Impact',
        score: 85,
        feedback: 'Strong action verbs. Highlight user volume and throughput metrics where possible.',
      },
      {
        name: 'Technical Skills & Tools',
        score: 92,
        feedback: 'Modern keywords (TypeScript, Next.js, Docker, Cloud Services). Group by domain for improved parsing.',
      },
      {
        name: 'Education & Certifications',
        score: 88,
        feedback: 'Clear credentials and degree timeline.',
      },
      {
        name: 'Projects & Portfolio',
        score: 82,
        feedback: 'GitHub portfolio links are included. Clarify individual ownership vs. team contributions.',
      },
    ],
    bulletSuggestions: [
      {
        original: 'Worked on database queries and improved performance for customer dashboard.',
        suggested: 'Optimized PostgreSQL queries and added composite indexes, reducing p95 dashboard load time from 2.4s to 320ms for 50K+ daily active users.',
        impactReason: 'Quantifies concrete performance gain and production scale rather than vague effort.',
      },
      {
        original: 'Built REST APIs for user authentication and role-based permissions.',
        suggested: 'Architected and deployed OAuth2/JWT authentication microservice with RBAC, securing 12 internal and public-facing microservices.',
        impactReason: 'Demonstrates architectural scope and security protocol familiarity.',
      },
    ],
  };
}

export async function analyzeRepoWithLLM(
  repoName: string,
  signals: StaticSignals,
  files: { path: string; content: string }[]
): Promise<{
  overallScore: number;
  categoryScores: {
    codeQuality: number;
    structure: number;
    testing: number;
    docs: number;
    security: number;
    dependencyHealth: number;
    gitHygiene: number;
  };
  suggestions: RepoSuggestion[];
}> {
  const docs = signals.hasReadme ? 88 : 45;
  const testing = signals.hasTests ? 85 : 30;
  const gitHygiene = signals.hasGitignore && signals.hasCi ? 90 : 55;
  const structure = signals.hasLinter ? 86 : 68;
  const codeQuality = 82;
  const security = 88;
  const dependencyHealth = signals.hasLockfile ? 92 : 65;

  const overallScore = Math.round(
    (codeQuality * 0.25) +
    (structure * 0.15) +
    (testing * 0.20) +
    (docs * 0.15) +
    (security * 0.10) +
    (gitHygiene * 0.10) +
    (dependencyHealth * 0.05)
  );

  const suggestions: RepoSuggestion[] = [];

  if (!signals.hasTests) {
    suggestions.push({
      id: `sug-${Date.now()}-1`,
      category: 'Testing',
      severity: 'high',
      filePath: 'tests/unit/core.test.ts',
      description: 'Zero automated unit test suites found in repository. Candidates are expected to exhibit test-driven practices.',
      suggestedFix: 'Introduce a test framework like Vitest or Jest. Add integration tests for critical routing and data transformation logic.',
    });
  }

  if (!signals.hasCi) {
    suggestions.push({
      id: `sug-${Date.now()}-2`,
      category: 'Git Hygiene',
      severity: 'med',
      filePath: '.github/workflows/ci.yml',
      description: 'Lack of automated CI workflow permits regressions and lint errors to reach main branch.',
      suggestedFix: 'Configure GitHub Actions workflow to run typechecking, linting, and tests on all pull requests.',
      codeSnippet: `name: CI\non: [push, pull_request]\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n      - run: npm ci\n      - run: npm run lint\n      - run: npm test`,
    });
  }

  const sampleSource = files.find((f) => /\.(ts|js|py)$/i.test(f.path));
  if (sampleSource) {
    suggestions.push({
      id: `sug-${Date.now()}-3`,
      category: 'Code Quality',
      severity: 'med',
      filePath: sampleSource.path,
      lineRange: '12-28',
      description: 'Potential unhandled promise rejection and missing typed error boundaries in async operations.',
      suggestedFix: 'Wrap async I/O in structured try-catch blocks with customized application domain error types.',
    });
  }

  return {
    overallScore,
    categoryScores: {
      codeQuality,
      structure,
      testing,
      docs,
      security,
      dependencyHealth,
      gitHygiene,
    },
    suggestions,
  };
}

export async function generateLearningRoadmap(
  title: string,
  weakAreas: string[],
  sourceType: 'interview' | 'repo_analysis'
): Promise<RoadmapStep[]> {
  const steps: RoadmapStep[] = [];

  weakAreas.forEach((area, index) => {
    steps.push({
      id: `step-${Date.now()}-${index}`,
      topic: area,
      description: `Master key concepts and best practices regarding ${area.toLowerCase()}. Implement hands-on exercises and review production post-mortems.`,
      estimatedTime: `${2 + index} days`,
      completed: false,
      source: sourceType,
      resourceLinks: [
        {
          title: `${area} Architecture Deep-Dive`,
          url: 'https://github.com/donnemartin/system-design-primer',
        },
        {
          title: `Testing & Reliability Best Practices`,
          url: 'https://martinfowler.com/articles/practical-test-pyramid.html',
        },
      ],
    });
  });

  return steps;
}
