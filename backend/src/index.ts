import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import interviewRouter from './routes/interview.js';
import repoAnalysisRouter from './routes/repoAnalysis.js';
import resumeRouter from './routes/resume.js';
import roadmapRouter from './routes/roadmap.js';
import githubRouter from './routes/github.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'ai-interview-agent-backend', timestamp: new Date().toISOString() });
});

// Mount modular routers
app.use('/api/interview', interviewRouter);
app.use('/api/repo-analysis', repoAnalysisRouter);
app.use('/api/resume', resumeRouter);
app.use('/api/roadmap', roadmapRouter);
app.use('/api/github', githubRouter);

// Global 404 handler
app.use((req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.url} not found` } });
});

app.listen(PORT, () => {
  console.log(`🚀 AI Interview Agent Backend listening on http://localhost:${PORT}`);
});
