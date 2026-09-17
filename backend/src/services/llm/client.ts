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
  const tabSwitches = antiCheatFlags.filter((f) => f.type === 'tab_switch').length;

  const conversation = transcript
    .map(t => `${t.role.toUpperCase()}: ${t.text}${t.codeSnapshot ? `\n[CODE]:\n${t.codeSnapshot}` : ''}`)
    .join('\n\n');

  const prompt = `You are an expert technical interviewer evaluating a candidate for a ${config.experienceLevel} ${config.role} position.
Review the following interview transcript:
---
${conversation}
---
The candidate switched browser tabs ${tabSwitches} times during the interview (which could indicate cheating if excessive).

Based STRICTLY on the candidate's answers and code, evaluate their performance. If the candidate provided very short, irrelevant, or no answers, their scores MUST be extremely low (0-20) and the feedback should state they did not participate or did not answer the questions. Do NOT give fake positive scores. Be genuine and harsh if needed.

Return a JSON object (do not include markdown wrapping like \`\`\`json) with exactly this structure:
{
  "overallScore": 68,
  "rubricScores": {
    "Problem Solving": 82,
    "Technical Accuracy": 86,
    "Communication & Clarity": 88,
    "System Design / Architecture": 79,
    "Code Quality & Best Practices": 80
  },
  "strongAreas": ["Clear architectural decomposition", "Solid grasp of Big-O complexity"],
  "weakAreas": ["Defensive error handling", "Testing coverage"],
  "citedFeedback": [
    {
      "topic": "Edge Case Handling",
      "severity": "needs_work",
      "text": "Eviction boundary test missed handling cache capacity of 0.",
      "transcriptTurnRef": "turn-3"
    }
  ]
}`;

  let scorecard: Scorecard | null = null;
  const response = await callLLM(prompt, "Please evaluate the candidate and return the JSON object.");
  
  if (response) {
    try {
      const parsed = JSON.parse(response.replace(/```json/g, '').replace(/```/g, '').trim());
      if (parsed && typeof parsed.overallScore === 'number') {
        scorecard = {
          id: `scorecard-${Date.now()}`,
          interviewId,
          overallScore: parsed.overallScore,
          rubricScores: parsed.rubricScores,
          strongAreas: parsed.strongAreas,
          weakAreas: parsed.weakAreas,
          citedFeedback: parsed.citedFeedback,
          createdAt: new Date().toISOString(),
        };
      }
    } catch (e) {
      console.warn("Failed to parse scorecard JSON:", response);
    }
  }

  // Fallback if LLM fails
  if (!scorecard) {
    scorecard = {
      id: `scorecard-${Date.now()}`,
      interviewId,
      overallScore: 0,
      rubricScores: {
        'Problem Solving': 0,
        'Technical Accuracy': 0,
        'Communication & Clarity': 0,
        'System Design / Architecture': 0,
        'Code Quality & Best Practices': 0,
      },
      strongAreas: [],
      weakAreas: ['Failed to generate evaluation from LLM.'],
      citedFeedback: [],
      createdAt: new Date().toISOString(),
    };
  }

  // Inject anti-cheat feedback if applicable
  if (tabSwitches > 0) {
    scorecard.citedFeedback.push({
      topic: 'Interview Environment',
      severity: 'critical' as const,
      text: `${tabSwitches} browser tab switch events recorded during session. Maintain focus during live evaluations.`,
      transcriptTurnRef: 'anti-cheat-log',
    });
  }

  return scorecard;
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

  // Fallback mock response if parsing fails
  return {
    summary: `Failed to analyze resume content. Please ensure the resume is text-readable and try again.`,
    detectedSkills: [],
    sections: [
      {
        name: 'Analysis Failed',
        score: 0,
        feedback: 'We could not generate a valid evaluation from the provided resume text.',
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
  const prompt = `You are an expert Senior Staff Software Engineer reviewing a GitHub repository named "${repoName}".
Here are some static signals detected:
- Has README: ${signals.hasReadme}
- Has Tests: ${signals.hasTests}
- Has CI: ${signals.hasCi}
- Has Linter: ${signals.hasLinter}
- Has Lockfile: ${signals.hasLockfile}

Here are snippets from key files:
${files.map(f => `--- ${f.path} ---\n${f.content.slice(0, 500)}`).join('\n\n')}

Analyze the repository and provide a genuine score. DO NOT give fake positive scores. If the code is poor or missing, give low scores.
Return a JSON object (no markdown wrapping) exactly matching this structure:
{
  "overallScore": 0, // 0-100
  "categoryScores": {
    "codeQuality": 0,
    "structure": 0,
    "testing": 0,
    "docs": 0,
    "security": 0,
    "dependencyHealth": 0,
    "gitHygiene": 0
  },
  "suggestions": [
    {
      "id": "sug-1",
      "category": "Testing",
      "severity": "high",
      "filePath": "src/index.js",
      "description": "Explanation of issue",
      "suggestedFix": "How to fix it"
    }
  ]
}`;

  const response = await callLLM(prompt, "Please analyze the repo and return the JSON object.");
  
  if (response) {
    try {
      const parsed = JSON.parse(response.replace(/```json/g, '').replace(/```/g, '').trim());
      if (parsed && typeof parsed.overallScore === 'number') {
        return parsed;
      }
    } catch (e) {
      console.warn("Failed to parse repo analysis JSON:", response);
    }
  }

  // Fallback if LLM fails
  return {
    overallScore: 0,
    categoryScores: {
      codeQuality: 0,
      structure: 0,
      testing: 0,
      docs: 0,
      security: 0,
      dependencyHealth: 0,
      gitHygiene: 0,
    },
    suggestions: [{
      id: `sug-${Date.now()}`,
      category: 'System',
      severity: 'high',
      filePath: '',
      description: 'The LLM failed to analyze this repository.',
      suggestedFix: 'Try analyzing a smaller repository or check API keys.',
    }],
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
