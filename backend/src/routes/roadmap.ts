import { Router, Request, Response } from 'express';
import { db } from '../store/db.js';
import { Roadmap } from '../types/index.js';
import { generateLearningRoadmap } from '../services/llm/client.js';

const router = Router();

// GET /api/roadmap - List all roadmaps
router.get('/', (req: Request, res: Response) => {
  res.json({ roadmaps: Array.from(db.roadmaps.values()) });
});

// POST /api/roadmap - Generate roadmap from source
router.post('/', async (req: Request, res: Response) => {
  try {
    const { sourceType, sourceId } = req.body;

    let weakAreas: string[] = ['System Scalability', 'Advanced Data Structures & Algorithms'];
    let title = 'General Technical Interview Prep';

    if (sourceType === 'scorecard' && sourceId) {
      const scorecard = db.scorecards.get(sourceId);
      if (scorecard && scorecard.weakAreas.length > 0) {
        weakAreas = scorecard.weakAreas;
        title = 'Interview Weak Areas Remediation';
      }
    } else if (sourceType === 'repoAnalysis' && sourceId) {
      const analysis = db.repoAnalyses.get(sourceId);
      if (analysis) {
        title = `Project Quality Roadmap: ${analysis.repoName}`;
        weakAreas = Object.entries(analysis.categoryScores)
          .filter(([, score]) => score < 75)
          .map(([cat]) => cat.charAt(0).toUpperCase() + cat.slice(1));
      }
    }

    const steps = await generateLearningRoadmap(title, weakAreas, sourceType || 'interview');
    const roadmapId = `roadmap-${Date.now()}`;

    const roadmap: Roadmap = {
      id: roadmapId,
      userId: 'user-demo-1',
      sourceScorecardId: sourceType === 'scorecard' ? sourceId : undefined,
      sourceRepoAnalysisId: sourceType === 'repoAnalysis' ? sourceId : undefined,
      title,
      steps,
      createdAt: new Date().toISOString(),
    };

    db.roadmaps.set(roadmapId, roadmap);
    res.json({ roadmapId, roadmap });
  } catch (error) {
    console.error('Create roadmap error:', error);
    res.status(500).json({ error: { code: 'ROADMAP_CREATE_FAILED', message: 'Could not generate roadmap' } });
  }
});

// GET /api/roadmap/:id - Get specific roadmap
router.get('/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const roadmap = db.roadmaps.get(id);

  if (!roadmap) {
    return res.status(404).json({ error: { code: 'ROADMAP_NOT_FOUND', message: 'Roadmap not found' } });
  }

  res.json(roadmap);
});

// PATCH /api/roadmap/:id/steps/:stepId - Toggle completion
router.patch('/:id/steps/:stepId', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const stepId = req.params.stepId as string;
    const roadmap = db.roadmaps.get(id);

    if (!roadmap) {
      return res.status(404).json({ error: { code: 'ROADMAP_NOT_FOUND', message: 'Roadmap not found' } });
    }

    const { completed } = req.body;
    const step = roadmap.steps.find((s) => s.id === stepId);

    if (!step) {
      return res.status(404).json({ error: { code: 'STEP_NOT_FOUND', message: 'Step not found' } });
    }

    step.completed = Boolean(completed);
    db.roadmaps.set(id, roadmap);

    res.json({ ok: true, step });
  } catch (error) {
    console.error('Update roadmap step error:', error);
    res.status(500).json({ error: { code: 'STEP_UPDATE_FAILED', message: 'Failed to update step' } });
  }
});

export default router;
