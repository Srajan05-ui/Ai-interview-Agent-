# Product Requirements Document (PRD) — AI Interview Agent

## 1. Summary
AI Interview Agent helps candidates prepare for technical interviews by
combining resume analysis, adaptive AI-led mock interviews (voice/text + live
coding), rubric-based scoring, personalized learning roadmaps, and — new in
this release — GitHub repository analysis so candidates can get their actual
projects scored and critiqued, not just their resume and interview answers.

## 2. Problem statement
Candidates preparing for technical interviews lack a way to get honest,
structured, actionable feedback before the real thing. Resume reviews are
generic, mock interviews with peers are inconsistent, and candidates have no
way to know if their portfolio projects would actually hold up under
scrutiny from an interviewer who opens the repo.

## 3. Goals
- G1: Let a candidate go from "I have a resume and a project" to "I have a
  score, specific feedback, and a study plan" in one session.
- G2: Make feedback specific and actionable (tied to a resume bullet, a
  transcript turn, or a file/line in their repo) — not generic advice.
- G3: Make the GitHub repo analysis feature (new) feel like a natural
  extension of the existing resume/interview scoring loop, not a bolted-on tool.

## Non-goals
- Not a replacement for a real interview loop with human interviewers.
- Not a job-matching or job-application platform.
- v1 repo analysis is not a full static-analysis suite (see
  `04-feature-github-repo-analysis.md` § Non-goals) — lightweight deterministic
  checks + LLM read only.

## 4. Target users
- Primary: job-seeking software engineers (new grad through mid-level)
  preparing for technical interviews.
- Secondary: bootcamp/course graduates who want a portfolio project reviewed
  before applying.

## 5. Scope — features in this release
All features from `01-features.md`, plus the new feature below.

| # | Feature | Priority |
|---|---|---|
| 1 | Auth & user management | P0 (existing) |
| 2 | Resume upload & ATS scoring | P0 (existing) |
| 3 | Interview setup & config | P0 (existing) |
| 4 | Adaptive AI interview (voice/text + live coding) | P0 (existing) |
| 5 | Evaluation & scorecard | P0 (existing) |
| 6 | Learning roadmap | P0 (existing) |
| 7 | Interview history | P0 (existing) |
| 8 | **GitHub repo connection, analysis, scoring & suggestions** | **P0 (new)** |
| 9 | Repo weak areas → roadmap integration | P1 (new) |
| 10 | "Attach project" during interview setup (interviewer references real code) | P2 (new, stretch) |

## 6. User stories (repo analysis feature — the ask for this release)
See `04-feature-github-repo-analysis.md` for the full story list and flow.
Summary for PRD purposes:
- Connect GitHub (OAuth) or paste a public repo URL.
- Select repo/branch, exclude folders.
- Get an overall score + category scores + file-referenced suggestions.
- Send weak categories into the existing roadmap generator.
- Disconnect GitHub / revoke token at any time.

## 7. Success metrics
- % of candidates who complete a repo analysis after connecting GitHub
  (activation).
- % of repo analyses where the candidate sends weak areas to their roadmap
  (perceived usefulness).
- Median time from "connect repo" to "score returned" (should feel closer to
  resume-scoring latency than to a full interview session).
- Support/complaint rate for "score felt wrong or generic" (quality signal
  for the scoring rubric).

## 8. Requirements

### Functional
- FR1: User can connect a GitHub account via OAuth with minimal scope.
- FR2: User can instead analyze a public repo without connecting an account.
- FR3: System filters out non-source, oversized, and denylisted files before
  analysis.
- FR4: System redacts likely secrets from any content before it reaches the
  LLM or logs.
- FR5: System returns an overall score, category scores, and a suggestions
  list with file references.
- FR6: User can push repo-analysis weak areas into their roadmap.
- FR7: User can disconnect GitHub; stored token is deleted/revoked.
- FR8: Analysis runs as a background job with visible status
  (queued/analyzing/completed/failed) and specific error messaging on failure.

### Non-functional
- NFR1 (Security): No secrets, tokens, or raw private-repo content persisted
  in logs. See `02-architecture.md` § Security notes.
- NFR2 (Performance): Analysis of a typical repo (<500 files after filtering)
  should complete within a few minutes; user-visible status updates throughout.
- NFR3 (Reliability): Rate-limited/failed GitHub or LLM calls retry with
  backoff rather than surfacing a raw error.
- NFR4 (Privacy): Candidates can delete a repo analysis and its stored file
  contents independently of disconnecting GitHub entirely.

## 9. Out of scope for this release
- Private-org repos requiring admin approval.
- Multi-repo comparison or leaderboards.
- Full static-analysis toolchain (ESLint/SonarQube-grade) integration.

## 10. Open questions
- Do we support private repos in v1, or public-only? (Affects OAuth scope —
  recommend starting public-only per `04-feature-github-repo-analysis.md`.)
- Should repo analysis consume the same subscription/credit system as
  interviews, if one exists, or be a separate free tier to drive activation?
- Should "Attach project" (P2 stretch, item 10 above) ship this release or next?

## Related docs
- `01-features.md` — full existing feature spec
- `02-architecture.md` — system architecture
- `03-data-model.md` — entities
- `04-feature-github-repo-analysis.md` — full new-feature spec
- `05-api-reference.md` — API contract
- `06-tech-stack.md` — stack decisions
- `07-design.md` — UX/design spec
