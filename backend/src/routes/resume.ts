import { Router, Request, Response } from 'express';
import { db } from '../store/db.js';
import { Resume } from '../types/index.js';
import { analyzeResumeContent } from '../services/llm/client.js';

const router = Router();

// GET /api/resume - List resumes
router.get('/', (req: Request, res: Response) => {
  res.json({ resumes: Array.from(db.resumes.values()) });
});

// POST /api/resume - Parse and evaluate resume
router.post('/', async (req: Request, res: Response) => {
  try {
    const { fileName = 'candidate_resume.pdf', text = '' } = req.body;

    const resumeId = `resume-${Date.now()}`;
    const feedback = await analyzeResumeContent(fileName, text);
    const atsScore = 87;

    const resume: Resume = {
      id: resumeId,
      userId: 'user-demo-1',
      fileName,
      atsScore,
      feedback,
      createdAt: new Date().toISOString(),
    };

    db.resumes.set(resumeId, resume);

    res.json({
      resumeId,
      status: 'completed',
      atsScore,
      feedback,
    });
  } catch (error) {
    console.error('Resume analysis error:', error);
    res.status(500).json({ error: { code: 'RESUME_PARSING_FAILED', message: 'Failed to process resume' } });
  }
});

// GET /api/resume/:id - Get resume feedback
router.get('/:id', (req: Request, res: Response) => {
  const id = req.params.id as string;
  const resume = db.resumes.get(id);

  if (!resume) {
    return res.status(404).json({ error: { code: 'RESUME_NOT_FOUND', message: 'Resume record not found' } });
  }

  res.json(resume);
});

export default router;
