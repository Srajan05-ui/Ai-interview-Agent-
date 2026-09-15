# Feature Spec: Connect GitHub Repository → Analyze, Score & Suggest

## Goal
Let a candidate connect a GitHub repository (their own project) so the system
can analyze the actual codebase and produce a score with concrete, actionable
suggestions — the same way the resume is scored today, but for code.

## User stories
- As a candidate, I can connect my GitHub account so the app can list my repos.
- As a candidate, I can instead paste a public repo URL without connecting my
  account, if I just want a quick analysis.
- As a candidate, I can pick a repo (and optionally a branch/subfolder) and
  request an analysis.
- As a candidate, I see an overall score, category breakdown, and a list of
  specific, file-referenced suggestions.
- As a candidate, my weak areas from repo analysis can feed into my existing
  learning roadmap alongside interview weak areas.
- As a candidate, I can disconnect GitHub and my stored token is revoked/deleted.

## Entry points
- Dashboard: new "Analyze a Repo" card next to "Start Interview" and "Upload Resume".
- Optional: during interview setup, an "Attach a project (optional)" step that
  lets the interviewer reference the candidate's actual code during questions.

## Flow

### 1. Connect / provide a repo
Two supported paths — support both, don't force account connection:
- **OAuth path:** "Connect GitHub" → GitHub OAuth App flow → request minimal
  scope (`public_repo` for public-only, or `repo` only if private repos are
  in scope for v1 — recommend starting public-only). Store token encrypted.
- **URL path:** paste a public repo URL (e.g., `https://github.com/user/repo`)
  — no auth required, works via GitHub's public REST API with rate limits.

### 2. Repo selection
- If connected via OAuth: fetch `GET /user/repos`, show a searchable list with
  name, primary language, last updated, star count.
- Let the user pick a branch (default: repo's default branch) and optionally
  exclude folders (e.g., `node_modules`, `vendor`, generated files) — auto-skip
  common ignorable paths using `.gitignore` plus a built-in denylist.

### 3. Fetch & prepare code for analysis
- Pull the file tree via GitHub API (`GET /repos/{owner}/{repo}/git/trees/{sha}?recursive=1`).
- Filter to source files under a size/count budget (e.g., skip binaries, lockfiles,
  minified assets, anything over ~500KB, cap total files sent to the analyzer).
- Fetch file contents for the filtered set (`GET /repos/{owner}/{repo}/contents/{path}`
  or a shallow git clone if volume is large).
- **Secret-scan before anything leaves the server:** strip/redact likely
  secrets (`.env` values, private keys, tokens matching common patterns)
  before any content is sent to the LLM or logged.

### 4. Run the analysis
Analysis should combine **static, deterministic signals** with an **LLM pass**,
not rely on the LLM alone:

- Static/deterministic signals (cheap, fast, no LLM needed):
  - Presence of README, LICENSE, tests, CI config, `.gitignore`
  - Test coverage indicator if a coverage report/config exists
  - Dependency freshness (flag major-version-behind packages if a lockfile is present)
  - Basic linting/formatting config presence
  - Commit history health (commit frequency, message quality — via `GET /repos/{owner}/{repo}/commits`)
  - Folder structure conventions for the detected framework
- LLM pass (given the filtered, redacted file set + static signal summary):
  - Code quality read: naming, modularity, duplication, error handling
  - Architecture read: is the structure appropriate for the project's apparent purpose
  - Security read: obvious anti-patterns (hardcoded secrets already stripped
    upstream, unsafe eval/exec usage, missing input validation on obvious entry points)
  - Best-practices read: framework-idiomatic usage vs. anti-patterns
  - Produces: category scores + a suggestions list, each tied to a specific
    file path (and line range where feasible)

### 5. Output — Repo Scorecard
- **Overall score** (0–100).
- **Category scores**, e.g.: Code Quality, Structure & Architecture, Testing,
  Documentation, Security, Dependency Health, Git Hygiene.
- **Suggestions list**, each with: category, severity (low/med/high), file
  path (+ line range if available), description, suggested fix — displayed
  like the resume's bullet-level feedback.
- **"Send weak areas to my roadmap"** action — merges low-scoring categories
  into the existing `Roadmap` generation step (reuse the roadmap generator
  from doc 03, just with a `RepoAnalysis` source instead of a `Scorecard`).

### 6. Background processing & status
- Analysis is a background job (repo fetch + LLM pass can take a while) —
  show `queued → analyzing → completed/failed` status with progress messaging,
  don't block the UI thread on a single long request.
- On failure (private repo without access, repo too large, rate-limited),
  show a clear, specific error — not a generic failure.

## Edge cases to handle
- Private repo without granted scope → prompt to reconnect with broader scope,
  don't fail silently.
- Empty or near-empty repo → return a low score with a clear "not enough
  content to analyze" message rather than a fabricated breakdown.
- Monorepo / very large repo → cap analyzed files, tell the user analysis was
  scoped to the N most relevant files (entry points, most-changed files).
- Non-code repos (docs-only, data-only) → detect and adjust the rubric
  (skip "code quality" scoring, note it explicitly) rather than scoring
  against an inapplicable rubric.
- Rate limiting (GitHub API, LLM API) → queue and retry with backoff, surface
  wait time to the user rather than erroring immediately.

## API surface (see `05-api-reference.md` for full contract)
- `POST /api/github/oauth/callback`
- `GET /api/github/repos`
- `POST /api/repo-analysis` — body: `{ repoUrl, branch?, excludePaths? }`
- `GET /api/repo-analysis/{id}` — poll for status/result
- `POST /api/repo-analysis/{id}/send-to-roadmap`
- `DELETE /api/github/connection`

## Non-goals for v1
- Full static-analysis toolchain integration (ESLint/SonarQube-style deep
  scanning) — the deterministic checks above are intentionally lightweight.
  Note this as a documented future extension point, don't build it now.
- Private-org repos requiring admin approval flows.
- Multi-repo comparison/leaderboards.
