# Design Doc

## Part A — UX / Visual Design

### Design principles
- **Feels like feedback, not a form.** Scores and suggestions should read like
  a mentor's review, not a raw JSON dump — this applies equally to the resume,
  interview, and new repo-analysis scorecards, so they should share one
  visual language.
- **Specificity over polish.** Every piece of feedback (resume bullet,
  transcript turn, repo file/line) links back to the exact source. This is
  the product's core differentiator — never show an ungrounded suggestion.
- **Low-friction entry.** The repo-analysis feature must work without forcing
  a GitHub OAuth connection (paste-a-URL path) — don't gate the core value
  behind an account-linking step.

### Key screens

**Dashboard**
- Three primary entry cards: "Start Interview", "Analyze Resume", "Analyze a
  Repo" (new) — equal visual weight, not the repo card looking secondary.
- Recent activity feed: last interview score, last repo score, roadmap
  progress bar.

**Repo Analysis — Connect/Select (new)**
- Two tabs: "Connect GitHub" and "Paste a URL" — paste-URL is the faster path
  and should not feel like the degraded option.
- Repo list (if connected): searchable, shows language badge + last updated.
- Branch selector + optional "exclude folders" chips (pre-filled with
  auto-detected `.gitignore` entries, editable).
- Primary CTA: "Analyze this repo" → transitions to status screen.

**Repo Analysis — Status (new)**
- Simple state machine UI: Queued → Fetching files → Analyzing → Done.
- Show file count being analyzed once known ("Analyzing 214 files").
- On failure, show the specific reason (see error codes in
  `05-api-reference.md`) with a clear next action, not a dead end.

**Repo Analysis — Scorecard (new)**
- Overall score (large, top of page) + category score bars, visually
  consistent with the interview scorecard's strong/weak breakdown.
- Suggestions list grouped by category, each row: severity badge, file path
  (clickable — opens a read-only code snippet view with the relevant lines
  highlighted), description, suggested fix.
- Sticky "Send weak areas to my roadmap" CTA.

**Interview session**
- Split view: conversation transcript (left) + `CodeEditorPanel.tsx` (right,
  shown only in coding mode).
- Subtle anti-cheat indicator (e.g., a small "recording" style dot) — flags
  are logged, not blocking, so the UI should not interrupt the candidate when
  a flag fires.

**Scorecard (interview)**
- Radar or bar chart of rubric topics.
- Transcript-cited feedback: each feedback item expands to show the exact
  transcript turn it references.

**Roadmap**
- Step list grouped by source (interview weak areas vs. repo weak areas),
  each with resources, estimated time, and a completion checkbox.

### Visual system
- Reuse one component library across resume/interview/repo scorecards
  (score bar, category badge, suggestion row) rather than building three
  bespoke versions — this is both a design-consistency and an engineering-
  reuse requirement.
- Severity color convention (repo suggestions) should match weak/strong color
  convention already used in interview scorecards (e.g., same red/amber/green
  scale) so a candidate doesn't have to relearn color meaning between features.

---

## Part B — System Design

### Component diagram (conceptual)
```
[Next.js Frontend]
   |-- Dashboard, Interview UI, Resume UI, Repo Analysis UI
   |
   v
[API Layer: Next.js API routes]
   |-- CRUD endpoints (see 05-api-reference.md)
   |-- Enqueues long jobs (resume parse, repo analysis) onto job queue
   |
   v
[Background Worker Service]
   |-- Resume parser (PDF/DOCX -> text -> LLM feedback)
   |-- Repo analysis pipeline (fetch -> filter -> redact -> static signals -> LLM pass -> score)
   |-- Roadmap generator (scorecard/repoAnalysis -> LLM -> steps)
   |
   v
[External services]
   |-- GitHub REST API (repo/file/commit data)
   |-- Anthropic Claude API (all LLM passes)
   |-- Firebase Auth / Storage
   |-- Firestore (all persisted entities, see 03-data-model.md)
```

### Repo analysis pipeline — detailed steps
1. **Enqueue**: `POST /api/repo-analysis` validates input, writes a
   `RepoAnalysis` record with `status: queued`, pushes a job.
2. **Fetch**: worker resolves repo + branch, pulls the recursive tree,
   applies `.gitignore` + denylist + size/count budget filtering
   (`ignore` package).
3. **Redact**: every file's content passes through the secret-pattern
   scanner before it is held in memory beyond the fetch step; redacted
   spans are replaced with a placeholder, never logged.
4. **Static signals**: deterministic checks run directly on the filtered
   tree/metadata (README/LICENSE/tests/CI presence, dependency freshness
   from lockfile, commit history health from the commits endpoint).
5. **LLM pass**: redacted file set + static signal summary sent to Claude
   with a structured-output prompt (JSON schema: category scores +
   suggestions array with file path, severity, description, fix).
6. **Persist**: worker writes `overallScore`, `categoryScores`,
   `suggestions`, sets `status: completed` (or `failed` with an error code).
7. **Notify**: frontend, which has been polling `GET /api/repo-analysis/{id}`,
   renders the scorecard once `status` flips.

### Failure handling
- Each pipeline step is idempotent/retryable independently; a failure at
  step 3 (redact) or later never leaves partially-redacted content persisted.
- GitHub/LLM rate limits trigger exponential backoff at the worker level,
  not user-facing retries — the status screen just stays on "Analyzing"
  longer with an honest sub-status if it's a known backoff (see NFR3 in `prd.md`).

### Data retention
- Redacted file contents used for analysis are not persisted beyond the job
  — only the resulting `RepoAnalysis` record (scores + suggestions with
  file paths, not full file contents) is stored long-term, minimizing what's
  retained from a candidate's private code.

## Related docs
- `prd.md` — product requirements
- `06-tech-stack.md` — stack choices referenced above
- `04-feature-github-repo-analysis.md` — feature-level flow this design doc implements
- `03-data-model.md` — entities referenced above
