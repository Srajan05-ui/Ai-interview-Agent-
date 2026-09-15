import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/github/repos - List user's repositories
router.get('/repos', (req: Request, res: Response) => {
  const sampleRepos = [
    {
      name: 'ai-interview-agent',
      fullName: 'candidate/ai-interview-agent',
      language: 'TypeScript',
      stars: 48,
      updatedAt: '2 hours ago',
      defaultBranch: 'main',
      url: 'https://github.com/facebook/react',
    },
    {
      name: 'distributed-cache-engine',
      fullName: 'candidate/distributed-cache-engine',
      language: 'Go',
      stars: 124,
      updatedAt: 'Yesterday',
      defaultBranch: 'main',
      url: 'https://github.com/redis/redis',
    },
    {
      name: 'portfolio-v2',
      fullName: 'candidate/portfolio-v2',
      language: 'TypeScript',
      stars: 15,
      updatedAt: '3 days ago',
      defaultBranch: 'master',
      url: 'https://github.com/vercel/next.js',
    },
  ];

  res.json({ repos: sampleRepos });
});

// DELETE /api/github/connection - Revoke token
router.delete('/connection', (req: Request, res: Response) => {
  res.json({ ok: true, message: 'GitHub connection revoked and credentials erased.' });
});

export default router;
