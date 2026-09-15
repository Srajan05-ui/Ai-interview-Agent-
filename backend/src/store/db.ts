import { Interview, Scorecard, RepoAnalysis, Roadmap, Resume, User } from '../types/index.js';

export class DatabaseStore {
  users = new Map<string, User>();
  interviews = new Map<string, Interview>();
  scorecards = new Map<string, Scorecard>();
  repoAnalyses = new Map<string, RepoAnalysis>();
  roadmaps = new Map<string, Roadmap>();
  resumes = new Map<string, Resume>();

  constructor() {
    // Database starts clean for incoming user sessions
  }
}

export const db = new DatabaseStore();
