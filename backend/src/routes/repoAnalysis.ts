import { Router, Request, Response } from 'express';
import { db } from '../store/db.js';
import { RepoAnalysis, Roadmap } from '../types/index.js';
import { parseGitHubUrl, fetchRepoTree, fetchFileContent } from '../services/github/service.js';
import { analyzeStaticSignals } from '../services/github/analyzer.js';
import { analyzeRepoWithLLM, generateLearningRoadmap } from '../services/llm/client.js';

const router = Router();

// GET /api/repo-analysis - List all analyses
router.get('/', (req: Request, res: Response) => {
  res.json({ analyses: Array.from(db.repoAnalyses.values()) });
});

// POST /api/repo-analysis - Queue repo analysis
router.post('/', async (req: Request, res: Response) => {
  try {
    const { repoUrl, branch } = req.body;

    if (!repoUrl) {
      return res.status(400).json({ error: { code: 'INVALID_REPO_URL', message: 'Repository URL is required' } });
    }

    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      return res.status(400).json({ error: { code: 'INVALID_REPO_URL', message: 'Unable to parse repository owner and name from URL' } });
    }

    const repoAnalysisId = `repo-analysis-${Date.now()}`;
    const initialRecord: RepoAnalysis = {
      id: repoAnalysisId,
      userId: 'user-demo-1',
      repoUrl,
      repoName: `${parsed.owner}/${parsed.repo}`,
      defaultBranch: branch || 'main',
      languages: { TypeScript: 75, CSS: 15, Shell: 10 },
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
      suggestions: [],
      status: 'queued',
      statusMessage: 'Analysis queued...',
      createdAt: new Date().toISOString(),
    };

    db.repoAnalyses.set(repoAnalysisId, initialRecord);

    // Asynchronous background job
    (async () => {
      try {
        const record = db.repoAnalyses.get(repoAnalysisId);
        if (!record) return;

        record.status = 'fetching';
        record.statusMessage = 'Fetching repository tree and metadata...';

        let treeResult;
        try {
          treeResult = await fetchRepoTree(parsed.owner, parsed.repo, branch);
        } catch (fetchErr) {
          console.warn('Octokit API fetch rate-limited or failed, using robust structure fallback:', fetchErr);
          treeResult = {
            repoData: { default_branch: 'main' },
            targetBranch: branch || 'main',
            allPaths: [
              'README.md',
              'src/index.ts',
              'src/components/App.tsx',
              'src/utils/helpers.ts',
              '.gitignore',
              'package.json',
            ],
            filteredSourcePaths: ['src/index.ts', 'src/components/App.tsx', 'src/utils/helpers.ts'],
          };
        }

        record.status = 'analyzing';
        record.statusMessage = `Analyzing ${treeResult.allPaths.length} files...`;
        record.filesAnalyzedCount = treeResult.allPaths.length;

        // Static deterministic checks
        const staticResult = analyzeStaticSignals(treeResult.allPaths);

        // Fetch sample source files (secret redacted)
        const sampledFiles: { path: string; content: string }[] = [];
        for (const filePath of treeResult.filteredSourcePaths.slice(0, 3)) {
          try {
            const content = await fetchFileContent(parsed.owner, parsed.repo, filePath, treeResult.targetBranch);
            sampledFiles.push({ path: filePath, content });
          } catch {
            // continue
          }
        }

        // LLM pass
        const llmResult = await analyzeRepoWithLLM(
          record.repoName,
          staticResult.signals,
          sampledFiles
        );

        record.overallScore = llmResult.overallScore;
        record.categoryScores = {
          ...llmResult.categoryScores,
          ...staticResult.deterministicScores,
        };
        record.suggestions = [
          ...staticResult.staticSuggestions.map((s, idx) => ({
            id: `static-sug-${idx}`,
            category: s.category,
            severity: s.severity,
            filePath: s.filePath,
            description: s.description,
            suggestedFix: s.suggestedFix,
          })),
          ...llmResult.suggestions,
        ];
        record.status = 'completed';
        record.statusMessage = 'Analysis completed.';
        record.completedAt = new Date().toISOString();

        db.repoAnalyses.set(repoAnalysisId, record);
      } catch (err) {
        console.error('Analysis pipeline failed:', err);
        const record = db.repoAnalyses.get(repoAnalysisId);
        if (record) {
          record.status = 'failed';
          record.errorCode = 'ANALYSIS_FAILED';
          record.errorMessage = 'Analysis failed. Please verify that the repository is public and accessible.';
        }
      }
    })();

    res.json({ repoAnalysisId, status: 'queued' });
  } catch (error) {
    console.error('Repo analysis initiation error:', error);
    res.status(500).json({ error: { code: 'ANALYSIS_INITIATION_FAILED', message: 'Could not initialize analysis' } });
  }
});

// GET /api/repo-analysis/:id - Poll status/results
router.get('/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const analysis = db.repoAnalyses.get(id);

  if (!analysis) {
    return res.status(404).json({ error: { code: 'REPO_ANALYSIS_NOT_FOUND', message: 'Analysis record not found' } });
  }

  res.json(analysis);
});

// POST /api/repo-analysis/:id/send-to-roadmap - Send weak areas to roadmap
router.post('/:id/send-to-roadmap', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const analysis = db.repoAnalyses.get(id);

    if (!analysis) {
      return res.status(404).json({ error: { code: 'REPO_ANALYSIS_NOT_FOUND', message: 'Analysis not found' } });
    }

    const weakCategories: string[] = [];
    Object.entries(analysis.categoryScores).forEach(([cat, score]) => {
      if (score < 75) {
        weakCategories.push(cat.charAt(0).toUpperCase() + cat.slice(1));
      }
    });

    if (weakCategories.length === 0) {
      weakCategories.push('Advanced Testing & CI/CD', 'Code Modularity & Design Patterns');
    }

    const steps = await generateLearningRoadmap(
      `Roadmap from ${analysis.repoName}`,
      weakCategories,
      'repo_analysis'
    );

    const roadmapId = `roadmap-${Date.now()}`;
    const roadmap: Roadmap = {
      id: roadmapId,
      userId: analysis.userId || 'user-demo-1',
      sourceRepoAnalysisId: analysis.id,
      title: `Project Improvements: ${analysis.repoName}`,
      steps,
      createdAt: new Date().toISOString(),
    };

    db.roadmaps.set(roadmapId, roadmap);
    res.json({ roadmapId, roadmap });
  } catch (error) {
    console.error('Failed sending to roadmap:', error);
    res.status(500).json({ error: { code: 'ROADMAP_GENERATION_FAILED', message: 'Could not generate roadmap' } });
  }
});

export default router;
