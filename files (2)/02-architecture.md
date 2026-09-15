# Proposed Architecture

> Not verified against an existing repo. Confirm/adjust once Antigravity
> scaffolds the project.

## Suggested stack
- **Frontend:** Next.js (TypeScript), Tailwind CSS, `CodeEditorPanel.tsx` on
  Monaco or CodeMirror.
- **Backend:** Node.js (Next.js API routes or a separate Express/Fastify
  service) — or a Python (FastAPI) service if the LLM/analysis pipeline is
  Python-heavy.
- **Auth:** Firebase Authentication.
- **Database:** Firestore (pairs naturally with Firebase Auth) or Postgres if
  you need relational queries over interview history/roadmaps.
- **File storage:** Firebase Storage / S3 for resumes and code snapshots.
- **LLM provider:** Anthropic Claude API for question generation, grading,
  resume analysis, and (new) repo analysis.
- **Speech:** Web Speech API or a streaming STT/TTS provider (e.g., browser
  APIs first, upgrade to a dedicated service if quality is insufficient).
- **Background jobs:** needed for resume parsing and repo analysis (both can
  be slow) — a queue (e.g., Cloud Tasks, BullMQ + Redis) rather than blocking
  the request.

## High-level modules
```
/app
  /dashboard
  /interview
    /setup
    /session          # live interview UI, CodeEditorPanel.tsx
    /scorecard
  /resume
  /repo-analysis       # new feature, see doc 04
  /roadmap
/api (or /server)
  /auth
  /resume
  /interview
    /questions         # adaptive question generation
    /grading
  /repo-analysis        # new feature endpoints, see doc 05
  /roadmap
/lib
  /llm                 # prompt templates, LLM client wrapper
  /parsing             # resume/PDF/DOCX parsing
  /github               # new: GitHub API client, clone/fetch helpers
```

## Data flow (interview session)
1. Client starts session → backend creates `Interview` record with config.
2. Client streams answers → backend calls LLM with running transcript →
   returns next question.
3. On completion → backend runs grading pass over full transcript → writes
   `Scorecard`.
4. Scorecard weak areas → roadmap generator → writes `Roadmap`.

## Data flow (GitHub repo analysis) — summary, full detail in doc 04
1. Candidate connects GitHub (OAuth) or pastes a public repo URL.
2. Backend fetches repo metadata + file tree, selectively pulls source files.
3. Analysis job (LLM + static signals) produces a score + structured
   suggestions.
4. Results stored and optionally merged into the candidate's roadmap.

## Security notes
- Resume files and repo source may contain PII/secrets — never log raw file
  contents; strip likely secrets (`.env` contents, private keys) before
  sending code to the LLM.
- GitHub OAuth tokens: store encrypted, request minimal scopes (`repo:read`
  or `public_repo` only), allow disconnect/revoke from settings.
