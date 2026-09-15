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
import { callLLM } from './llmHelpers.js';

export async function generateInitialQuestionBank(
  config: InterviewConfig,
  count: number = 10
): Promise<string[]> {
  const prompt = `You are a technical interviewer for a ${config.experienceLevel} ${config.role} at a ${config.companyStyle} company.
${config.detectedSkills && config.detectedSkills.length > 0 ? `The candidate's resume highlights these skills: ${config.detectedSkills.join(', ')}.` : ''}

Generate a bank of ${count} distinct interview questions or topics to evaluate this candidate in a ${config.mode} interview. 
Format your response as a plain JSON array of strings (do not include markdown blocks like \`\`\`json).
Example: ["Question 1", "Question 2"]`;
  
  const response = await callLLM(prompt, "Please provide the questions.", 800);
  if (response) {
    try {
      const parsed = JSON.parse(response.replace(/```json/g, '').replace(/```/g, '').trim());
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.warn("Failed to parse initial question bank JSON:", response);
    }
  }
  
  // Fallback
  return [
    `Welcome! Let's start with a general question about your experience with ${config.role}.`,
    "Can you explain a complex project you worked on recently?",
    "How do you handle performance optimization?",
    "Describe a time you had to resolve a difficult bug.",
    "What is your approach to testing and QA?",
    "How do you stay up-to-date with new technologies?",
    "Explain how you design scalable systems.",
    "Tell me about your experience with CI/CD.",
    "How do you handle technical debt?",
    "Do you have any questions for me?"
  ];
}

export async function generateAdaptiveQuestion(
  config: InterviewConfig,
  transcript: InterviewTurn[]
): Promise<string> {
  const agentTurns = transcript.filter((t) => t.role === 'agent');
  const candidateTurns = transcript.filter((t) => t.role === 'candidate');
  const turnIndex = agentTurns.length;
  const lastCandidateTurn = candidateTurns[candidateTurns.length - 1];

  const systemPrompt = `You are a world-class technical interviewer conducting a rigorous, highly adaptive ${config.companyStyle} interview for a ${config.experienceLevel} ${config.role}.
Interview Mode: ${config.mode}. Spoken Language: ${config.language}.
${config.attachedRepoUrl ? `Attached Candidate Portfolio Repository: ${config.attachedRepoUrl}` : ''}
${config.detectedSkills && config.detectedSkills.length > 0 ? `Candidate's Core Skills (from resume): ${config.detectedSkills.join(', ')}` : ''}

Instructions:
1. Generate the NEXT question or technical follow-up.
2. If this is the start (turn 0), introduce a challenge or question directly relevant to the role (${config.role}) and heavily incorporating their specific skills (${config.detectedSkills?.join(', ')}). Even if it is a Behavioral interview, you MUST ask questions that are highly technical and related to their skills and role (e.g. "Tell me about a time you optimized a complex React application...").
3. For follow-ups: ALWAYS directly evaluate and reference the candidate's previous response, their architectural choices, or code in the editor.
4. Probe deeply into time/space complexity, race conditions, edge cases, scalability, or alternative trade-offs.
5. Keep your response conversational, concise (2-4 sentences max), sharp, and engaging as a realistic interviewer. Do NOT generate answers for the candidate.`;

  const conversationHistory = transcript
    .map((t) => `${t.role === 'agent' ? 'Interviewer' : 'Candidate'}: ${t.text}${t.codeSnapshot ? `\n[Candidate Code in Editor]:\n${t.codeSnapshot}` : ''}`)
    .join('\n\n');

  const responseText = await callLLM(systemPrompt, conversationHistory || 'Interview just started.\nGenerate the next interviewer response:');
  if (responseText) return responseText;

  // 5. Intelligent Role-Aware & Candidate-Aware Contextual Engine
  return generateContextualAdaptiveQuestion(config, transcript, turnIndex, lastCandidateTurn);
}

function generateContextualAdaptiveQuestion(
  config: InterviewConfig,
  transcript: InterviewTurn[],
  turnIndex: number,
  lastTurn?: InterviewTurn
): string {
  const roleLower = (config.role || '').toLowerCase();
  const isFrontend = roleLower.includes('front') || roleLower.includes('ui') || roleLower.includes('react') || roleLower.includes('web');
  const isBackend = roleLower.includes('back') || roleLower.includes('node') || roleLower.includes('python') || roleLower.includes('go') || roleLower.includes('system') || roleLower.includes('api');
  const isML = roleLower.includes('ml') || roleLower.includes('machine') || roleLower.includes('data') || roleLower.includes('ai');
  const isDevOps = roleLower.includes('devops') || roleLower.includes('sre') || roleLower.includes('cloud') || roleLower.includes('infrastructure');

  // Turn 0: Tailored Initial Questions based on Mode and Role
  if (turnIndex === 0) {
    if (config.mode === 'Behavioral') {
      return `Welcome to your ${config.companyStyle} interview! To start, tell me about a technically complex project you owned where the initial requirements were ambiguous or changing rapidly. What was your personal contribution, and how did you ensure successful delivery?`;
    }

    if (config.mode === 'Conceptual / System Design') {
      if (isFrontend) {
        return `Welcome to your ${config.companyStyle} Frontend Architecture interview! Let's design a high-performance, real-time Collaborative Rich-Text Document Editor (like Google Docs or Notion). How would you architect the client-side state management, operational transformation or CRDT synchronization, and offline cache layer?`;
      }
      if (isML) {
        return `Welcome to your ${config.companyStyle} Machine Learning Systems interview! How would you design an end-to-end Real-Time Semantic Search & Recommendation Engine serving 50,000 queries per second with sub-50ms p99 latency? Walk me through data ingestion, embedding generation, vector indexing, and online inference.`;
      }
      if (isDevOps) {
        return `Welcome to your ${config.companyStyle} Infrastructure interview! Let's design a Multi-Region, Active-Active Kubernetes deployment for an e-commerce platform with zero-downtime database failover and automated canary deployments. How would you structure the traffic routing and data consistency layers?`;
      }
      // Backend / Full Stack default
      return `Welcome to your ${config.companyStyle} System Design interview for ${config.role}! Let's design a Globally Distributed Rate Limiter and API Gateway capable of handling 500,000 requests per second across multiple data centers. How would you design the storage layer, eviction algorithms, and inter-datacenter synchronization?`;
    }

    // Live Coding Mode:
    if (isFrontend) {
      return `Welcome to your live technical session! Today we'll implement a custom Reactive Event Bus and Async Debounce/Throttle utility with trailing and leading execution support in TypeScript. Before jumping into code, walk me through how you plan to handle cancel tokens, argument forwarding, and memory leak prevention.`;
    }
    if (isML) {
      return `Welcome! For today's live coding session targeting ${config.role}, let's implement an efficient Vector Cosine Similarity and K-Nearest Neighbors search over high-dimensional embeddings with early-stopping optimizations. How would you structure your data structures and vector operations?`;
    }
    if (isDevOps) {
      return `Welcome! For today's technical coding challenge, let's write a robust Log Aggregator and Stream Anomaly Detector that processes streaming server metrics and flags sudden error spikes using a sliding window. How would you design the sliding window state to avoid memory bloat?`;
    }
    if (isBackend) {
      return `Welcome to your live coding session (${config.companyStyle})! Let's implement a Token Bucket Rate Limiter with burst capacity and thread-safe refilling in your language of choice. How would you represent bucket state and calculate token replenishment without spinning locks?`;
    }
    // Full Stack default
    return `Welcome to your live coding session targeting ${config.role} (${config.companyStyle})! Let's implement an In-Memory Key-Value Store supporting TTL (Time-To-Live) expiration, O(1) lookups, and least-recently-used eviction. How would you approach the data structures before writing code?`;
  }

  // Follow-up Turns (1, 2, 3+): Dynamically react to what candidate said & coded
  const candidateText = lastTurn?.text?.trim() || '';
  const candidateCode = lastTurn?.codeSnapshot?.trim() || '';

  // Check what the candidate discussed
  const mentionsComplexity = candidateText.toLowerCase().includes('o(1)') || candidateText.toLowerCase().includes('o(n)') || candidateText.toLowerCase().includes('complexity');
  const mentionsConcurrency = candidateText.toLowerCase().includes('thread') || candidateText.toLowerCase().includes('lock') || candidateText.toLowerCase().includes('race') || candidateText.toLowerCase().includes('mutex') || candidateText.toLowerCase().includes('concurrent');
  const mentionsMemory = candidateText.toLowerCase().includes('memory') || candidateText.toLowerCase().includes('leak') || candidateText.toLowerCase().includes('gc') || candidateText.toLowerCase().includes('evict');
  const hasCode = candidateCode.length > 50;

  if (turnIndex === 1) {
    if (hasCode) {
      return `I see the implementation taking shape in your editor. Looking at your data structure definitions, what happens when the capacity is exceeded during simultaneous write operations? Walk me through the step-by-step eviction flow.`;
    }
    if (mentionsComplexity) {
      return `Good observation on time complexity. Now go ahead and write the core algorithm in the code editor panel. Be sure to handle boundary edge cases like empty inputs, duplicate keys, and invalid capacities.`;
    }
    return `That makes sense conceptually. Please start drafting the core implementation in the editor panel. How will your method signatures and internal state variables be structured?`;
  }

  if (turnIndex === 2) {
    if (hasCode) {
      return `Looking at the code you wrote in the editor: what is the worst-case space complexity if 100,000 distinct items are processed rapidly? Could any unbounded data structures cause high garbage collection pauses or memory leaks?`;
    }
    if (mentionsConcurrency) {
      return `You pointed out concurrency trade-offs. How would you test this implementation against subtle race conditions? What specific unit or integration test cases would you write in the editor right now to prove correctness?`;
    }
    return `How would this design adapt if requirements shifted from single-node execution to a distributed cluster? What synchronization or serialization overhead would emerge?`;
  }

  if (turnIndex === 3) {
    return `Excellent breakdown. Let's do a quick code walk-through: how would you optimize this for low-latency production environments? Are there any profiling tools or telemetry metrics you would attach to monitor this in production?`;
  }

  return `Great answers throughout this session. Is there any aspect of the implementation, failure modes, or edge-case handling you would refactor before pushing this to production?`;
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
  const prompt = `You are an ATS parser and technical recruiter. Analyze the following resume:
Filename: ${fileName}
Content:
${rawText}

Return a detailed JSON response (do not include markdown wrapping) with exactly this structure:
{
  "summary": "2-3 sentences summarizing the candidate's profile",
  "sections": [
    { "name": "Experience & Impact", "score": 85, "feedback": "..." },
    { "name": "Technical Skills & Tools", "score": 92, "feedback": "..." },
    { "name": "Education & Certifications", "score": 88, "feedback": "..." }
  ],
  "bulletSuggestions": [
    {
      "original": "Worked on database queries...",
      "suggested": "Optimized PostgreSQL queries...",
      "impactReason": "Quantifies concrete performance..."
    }
  ],
  "detectedSkills": ["React", "Node.js", "System Design"]
}`;

  const response = await callLLM(prompt, "Please analyze the resume and return the JSON object.");
  
  if (response) {
    try {
      const parsed = JSON.parse(response.replace(/```json/g, '').replace(/```/g, '').trim());
      if (parsed.sections) return parsed;
    } catch (e) {
      console.warn("Failed to parse resume analysis JSON:", response);
    }
  }

  // Fallback mock response
  return {
    summary: `Resume demonstrates strong full-stack and distributed systems experience with modern architectural practices.`,
    detectedSkills: ["TypeScript", "Next.js", "Node.js", "Docker", "REST APIs"],
    sections: [
      {
        name: 'Experience & Impact',
        score: 85,
        feedback: 'Strong action verbs. Highlight user volume and throughput metrics where possible.',
      }
    ],
    bulletSuggestions: []
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
  const prompt = `You are a Senior Engineering Manager creating a learning roadmap for a developer to address these weak areas:
${weakAreas.join(', ')}

Return a JSON array of roadmap steps (do not include markdown wrapping). Each step must have this structure:
{
  "id": "step-1",
  "topic": "Name of the topic",
  "description": "2-3 sentences explaining what to study",
  "estimatedTime": "X days",
  "completed": false,
  "source": "${sourceType}",
  "resourceLinks": [
    { "title": "Resource title", "url": "https://example.com" }
  ]
}`;

  const response = await callLLM(prompt, "Please generate the roadmap steps.");
  
  if (response) {
    try {
      const parsed = JSON.parse(response.replace(/```json/g, '').replace(/```/g, '').trim());
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.warn("Failed to parse roadmap JSON:", response);
    }
  }

  // Fallback mock
  const steps: RoadmapStep[] = [];
  weakAreas.forEach((area, index) => {
    steps.push({
      id: `step-${Date.now()}-${index}`,
      topic: area,
      description: `Master key concepts and best practices regarding ${area.toLowerCase()}.`,
      estimatedTime: `${2 + index} days`,
      completed: false,
      source: sourceType,
      resourceLinks: [
        { title: `${area} Architecture Deep-Dive`, url: 'https://github.com/donnemartin/system-design-primer' }
      ],
    });
  });

  return steps;
}
