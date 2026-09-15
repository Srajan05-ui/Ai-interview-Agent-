import { Router, Request, Response } from 'express';
import { db } from '../store/db.js';
import { Interview, InterviewConfig, InterviewTurn, AntiCheatFlag } from '../types/index.js';
import { generateAdaptiveQuestion, gradeInterview } from '../services/llm/client.js';

const router = Router();

// POST /api/interview - Create new session
router.post('/', async (req: Request, res: Response) => {
  try {
    const config: InterviewConfig = req.body.config || {
      language: 'English',
      mode: 'Live Coding',
      companyStyle: 'Google-style',
      role: 'Full Stack Engineer',
      experienceLevel: 'Senior',
    };

    const interviewId = `interview-${Date.now()}`;
    const initialQuestion = await generateAdaptiveQuestion(config, []);

    const interview: Interview = {
      id: interviewId,
      userId: 'user-demo-1',
      config,
      transcript: [
        {
          id: 'turn-1',
          role: 'agent',
          text: initialQuestion,
          timestamp: new Date().toISOString(),
        },
      ],
      antiCheatFlags: [],
      status: 'in_progress',
      createdAt: new Date().toISOString(),
    };

    db.interviews.set(interviewId, interview);
    res.json({ interviewId, initialQuestion });
  } catch (error) {
    console.error('Create interview error:', error);
    res.status(500).json({ error: { code: 'INTERVIEW_CREATE_FAILED', message: 'Could not initialize interview session' } });
  }
});

// POST /api/interview/:id/answer - Submit answer, get follow-up
router.post('/:id/answer', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const interview = db.interviews.get(id);

    if (!interview) {
      return res.status(404).json({ error: { code: 'INTERVIEW_NOT_FOUND', message: 'Interview session not found' } });
    }

    const { text, codeSnapshot, language, antiCheatFlag } = req.body;

    if (antiCheatFlag) {
      interview.antiCheatFlags.push(antiCheatFlag as AntiCheatFlag);
    }

    const candidateTurn: InterviewTurn = {
      id: `turn-${Date.now()}`,
      role: 'candidate',
      text: text || '',
      codeSnapshot,
      language,
      timestamp: new Date().toISOString(),
    };
    interview.transcript.push(candidateTurn);

    const nextQuestion = await generateAdaptiveQuestion(interview.config, interview.transcript);

    const agentTurn: InterviewTurn = {
      id: `turn-${Date.now() + 1}`,
      role: 'agent',
      text: nextQuestion,
      timestamp: new Date().toISOString(),
    };
    interview.transcript.push(agentTurn);

    db.interviews.set(id, interview);
    res.json({ nextQuestion, transcript: interview.transcript });
  } catch (error) {
    console.error('Answer processing error:', error);
    res.status(500).json({ error: { code: 'ANSWER_SUBMISSION_FAILED', message: 'Failed to process answer' } });
  }
});

// POST /api/interview/:id/complete - End and grade
router.post('/:id/complete', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const interview = db.interviews.get(id);

    if (!interview) {
      return res.status(404).json({ error: { code: 'INTERVIEW_NOT_FOUND', message: 'Interview session not found' } });
    }

    interview.status = 'completed';
    interview.completedAt = new Date().toISOString();

    const scorecard = await gradeInterview(
      interview.id,
      interview.config,
      interview.transcript,
      interview.antiCheatFlags
    );

    db.scorecards.set(scorecard.id, scorecard);
    db.interviews.set(id, interview);

    res.json({ scorecardId: scorecard.id, scorecard });
  } catch (error) {
    console.error('Complete interview error:', error);
    res.status(500).json({ error: { code: 'INTERVIEW_COMPLETION_FAILED', message: 'Failed to grade interview session' } });
  }
});

// GET /api/interview/:id/scorecard - Retrieve scorecard
router.get('/:id/scorecard', (req: Request, res: Response) => {
  const id = req.params.id as string;
  let scorecard = db.scorecards.get(id);

  if (!scorecard) {
    for (const sc of db.scorecards.values()) {
      if (sc.interviewId === id) {
        scorecard = sc;
        break;
      }
    }
  }

  if (!scorecard) {
    return res.status(404).json({ error: { code: 'SCORECARD_NOT_FOUND', message: 'Scorecard not found' } });
  }

  res.json(scorecard);
});

export default router;
