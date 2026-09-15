# AI Interview Agent (Full-Stack)

AI-driven technical mock interview platform combining:
- **Adaptive AI Interviews**: Real-time voice/text questions & responses with anti-cheat detection and live code editor (`CodeEditorPanel.tsx`).
- **Rubric Performance Scorecards**: Sub-scores across problem solving, system design, code quality, communication, and cited feedback linked to transcript turns.
- **ATS Resume Review**: Parsing, ATS score (0-100), section analysis, and quantified before/after bullet rewrites.
- **GitHub Repository Analysis (New P0)**: Connect GitHub or paste a public repo URL to get static signal checks, secret redaction, and deep LLM architectural critiques.
- **Personalized Learning Roadmaps**: Weak areas from interviews or repository audits automatically feed into actionable milestones with estimated times and curated learning links.

---

## Project Structure

```
├── frontend/             # Next.js 15 App Router + Tailwind CSS UI
│   ├── src/
│   │   ├── app/          # Dashboard, Interview (Setup, Session, Scorecard), Repo Analysis, Resume, Roadmap
│   │   ├── components/   # Navbar, CodeEditorPanel, UI primitives
│   │   └── types/        # Typed data contracts
│   └── package.json
│
├── backend/              # Node.js + Express + TypeScript Backend
│   ├── src/
│   │   ├── routes/       # /api/interview, /api/resume, /api/repo-analysis, /api/roadmap, /api/github
│   │   ├── services/     # GitHub Octokit fetcher, secret scanner, static analyzer, LLM pipeline
│   │   ├── store/        # In-memory database store
│   │   └── index.ts      # Express server entry point (port 5000)
│   └── package.json
│
└── files (2)/            # Product specification docs (PRD, architecture, data model, etc.)
```

---

## Running the Application

### 1. Start the Backend Service
```bash
cd backend
npm install
npm run dev
```
The backend will launch on `http://localhost:5000`.

### 2. Start the Frontend Application
In another terminal:
```bash
cd frontend
npm install
npm run dev
```
The frontend will launch on `http://localhost:3000`. Next.js automatically proxies `/api/*` requests to the backend on `http://localhost:5000`.

---

## Environment Variables (Optional)

In `backend/.env`:
```env
PORT=5000
ANTHROPIC_API_KEY=your_anthropic_api_key_here  # Optional: App includes a smart local simulator if omitted!
GITHUB_TOKEN=your_github_personal_access_token # Optional: Increases GitHub API rate limits
```
