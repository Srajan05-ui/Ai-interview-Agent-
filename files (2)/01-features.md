# Core Features Specification

## 1. Authentication & User Management
- Login/Signup via Firebase Auth (Google, GitHub OAuth providers).
- User profile page: name, avatar, target roles, experience level.
- Dashboard: list of past interviews, resume scores, roadmap progress, quick
  "Start new interview" and "Analyze a repo" entry points.

## 2. Resume & Profile Analysis
- Upload resume as PDF or DOCX.
- Server-side parsing (text + structure extraction) feeds an LLM prompt that returns:
  - ATS Score (0–100)
  - Section-by-section feedback (summary, experience, skills, education)
  - Bullet-level rewrite suggestions (before/after)
- Score and feedback persisted to the user's profile history.

## 3. Interview Setup & Configuration
- Config form before each session:
  - Language (spoken language for the interview)
  - Mode: Technical Q&A vs. Live Coding vs. Behavioral
  - Target company style (e.g., "Google-style", "Startup-style") — used to bias
    question generation tone/difficulty
  - Role/level (e.g., "Junior Frontend", "Senior Backend")
- Pre-interview hardware check screen: microphone test, camera preview, screen-share
  permission prompt, network check.

## 4. Adaptive AI Interview Experience
- Voice/Text interaction: streaming speech-to-text for candidate answers; TTS or
  text bubble for AI questions.
- Adaptive questioning: each follow-up question is generated conditioned on the
  full running transcript, not a fixed question bank.
- Live Coding Environment: in-browser code editor (`CodeEditorPanel.tsx`) with
  language selection, run/test execution, and the editor state included in the
  transcript sent to the grading step.
- Anti-cheat detection: tab-visibility change events and screen-share
  interruption events are logged with timestamps and surfaced in the scorecard
  as flags (not silently enforced — visibility matters more than blocking).

## 5. Evaluation & Scorecard
- Rubric-based grading per topic (e.g., data structures, system design,
  communication) with numeric sub-scores.
- Feedback includes citations: each critique links back to a specific
  transcript timestamp/turn.
- Visual breakdown: Strong Areas vs. Weak Areas (radar or bar chart).

## 6. Personalized Learning Roadmaps
- Generated from the scorecard's weak areas.
- Step-by-step plan: topics, suggested resources/problems, estimated time.
- Roadmap items can be marked complete; progress rolls up to the dashboard.

## 7. Interview History
- Every session (config, full transcript, code editor snapshots, scorecard,
  anti-cheat flags) persisted.
- History view supports filtering by role/date/score and re-opening a past
  scorecard.

## 8. (New) GitHub Repository Analysis — see `04-feature-github-repo-analysis.md`
- Candidates connect a GitHub repo; the system analyzes code quality, structure,
  and practices, and returns a score + suggestions, usable standalone or folded
  into the interview/roadmap flow.
