export type RoleLevel = 'Junior' | 'Mid-Level' | 'Senior' | 'Lead' | 'Staff';

export type InterviewMode = 'Technical Q&A' | 'Live Coding' | 'Behavioral';

export type CompanyStyle = 'Google-style' | 'Startup-style' | 'Amazon-style' | 'Meta-style' | 'General';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  targetRole?: string;
  experienceLevel?: RoleLevel;
  githubConnected?: boolean;
  githubAccessTokenRef?: string;
  createdAt: string;
}

export interface ResumeFeedback {
  summary: string;
  sections: {
    name: string;
    score: number;
    feedback: string;
  }[];
  bulletSuggestions: {
    original: string;
    suggested: string;
    impactReason: string;
  }[];
}

export interface Resume {
  id: string;
  userId: string;
  fileName: string;
  fileUrl?: string;
  atsScore: number;
  feedback: ResumeFeedback;
  createdAt: string;
}

export interface InterviewConfig {
  language: string;
  mode: InterviewMode;
  companyStyle: CompanyStyle;
  role: string;
  experienceLevel: RoleLevel;
  attachedRepoUrl?: string;
}

export interface InterviewTurn {
  id: string;
  role: 'agent' | 'candidate';
  text: string;
  timestamp: string;
  codeSnapshot?: string;
  language?: string;
}

export interface AntiCheatFlag {
  type: 'tab_switch' | 'screen_interrupted' | 'multiple_faces' | 'paste_detected';
  timestamp: string;
  details?: string;
}

export type InterviewStatus = 'setup' | 'in_progress' | 'completed';

export interface Interview {
  id: string;
  userId: string;
  config: InterviewConfig;
  transcript: InterviewTurn[];
  antiCheatFlags: AntiCheatFlag[];
  status: InterviewStatus;
  createdAt: string;
  completedAt?: string;
}

export interface CitedFeedback {
  text: string;
  transcriptTurnRef?: string;
  topic: string;
  severity: 'positive' | 'needs_work' | 'critical';
}

export interface Scorecard {
  id: string;
  interviewId: string;
  overallScore: number;
  rubricScores: Record<string, number>;
  strongAreas: string[];
  weakAreas: string[];
  citedFeedback: CitedFeedback[];
  createdAt: string;
}

export interface RoadmapStep {
  id: string;
  topic: string;
  description: string;
  resourceLinks: { title: string; url: string }[];
  estimatedTime: string;
  completed: boolean;
  source: 'interview' | 'repo_analysis';
}

export interface Roadmap {
  id: string;
  userId: string;
  sourceScorecardId?: string;
  sourceRepoAnalysisId?: string;
  title: string;
  createdAt: string;
  steps: RoadmapStep[];
}

export type RepoAnalysisStatus = 'queued' | 'fetching' | 'analyzing' | 'completed' | 'failed';

export interface RepoSuggestion {
  id: string;
  category: string;
  severity: 'low' | 'med' | 'high';
  filePath: string;
  lineRange?: string;
  description: string;
  suggestedFix: string;
  codeSnippet?: string;
}

export interface RepoAnalysis {
  id: string;
  userId: string;
  repoUrl: string;
  repoName: string;
  defaultBranch: string;
  languages: Record<string, number>;
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
  status: RepoAnalysisStatus;
  statusMessage?: string;
  filesAnalyzedCount?: number;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
  errorCode?: string;
}
