# Tech Stack

> These are recommended defaults for building this project fresh in
> Antigravity. If Antigravity scaffolds something different (or a repo
> already exists), treat this as a checklist to reconcile against, not a
> mandate — update this file once real choices are locked in.

## Frontend
| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router, TypeScript) | SSR for dashboard/history pages, API routes co-located for simple backend needs |
| Styling | Tailwind CSS | fast iteration, matches `frontend-design` conventions |
| Code editor | Monaco Editor (via `@monaco-editor/react`) inside `CodeEditorPanel.tsx` | same engine as VS Code, familiar to candidates |
| Charts | Recharts | scorecard strong/weak breakdown, radar/bar charts |
| State | React Query (server state) + minimal local state | interview session, polling repo-analysis status |
| Real-time/streaming | WebSocket or SSE for interview turn-by-turn + STT streaming | needed for adaptive questioning to feel responsive |

## Backend
| Layer | Choice | Why |
|---|---|---|
| API | Next.js API routes for CRUD-style endpoints; a separate Node worker (or serverless functions) for long-running jobs (resume parsing, repo analysis) | keep interview turn latency low, isolate slow jobs |
| Background jobs | BullMQ + Redis (or Cloud Tasks if deploying on GCP) | repo analysis and resume parsing are not request/response-shaped |
| Auth | Firebase Authentication | Google/GitHub OAuth providers out of the box, per your existing requirement |
| Database | Firestore | pairs with Firebase Auth, schemaless fits evolving `Interview`/`RepoAnalysis` JSON blobs |
| File storage | Firebase Storage | resumes, code snapshots |
| Secrets | Google Secret Manager (or platform equivalent) for GitHub OAuth app secret, encrypted-at-rest storage for per-user GitHub tokens | never store tokens in plaintext in Firestore |

## AI / LLM
| Purpose | Choice |
|---|---|
| Question generation, grading, resume feedback, repo analysis LLM pass | Anthropic Claude API |
| Speech-to-text | Browser Web Speech API first; upgrade to a dedicated streaming STT provider if accuracy/latency is insufficient |
| Text-to-speech | Browser SpeechSynthesis API first, same upgrade path |

## External integrations
| Integration | Purpose |
|---|---|
| GitHub REST API v3 (`api.github.com`) | repo listing, file tree, file contents, commit history for repo analysis |
| GitHub OAuth App | user-authorized repo access |
| Firebase Auth providers (Google, GitHub) | login/signup |

## Testing
| Layer | Tool |
|---|---|
| Unit | Vitest (or Jest) |
| Component | React Testing Library |
| E2E | Playwright — cover the full "connect repo → get score" flow end to end since it spans OAuth, background jobs, and polling |
| API contract | typed shared schema (Zod) validated on both client and server for every route in `05-api-reference.md` |

## Infra / deployment
| Layer | Choice |
|---|---|
| Hosting | Vercel (Next.js-native) or Firebase Hosting |
| Background workers | separate deploy target (Cloud Run / small Node service) since Vercel functions have execution time limits unsuitable for repo analysis |
| CI | GitHub Actions — lint, typecheck, unit tests, Playwright smoke test on PR |
| Env management | `.env.local` for dev, platform secret manager for prod — never commit `.env` |

## Key libraries (repo analysis feature specifically)
| Need | Library |
|---|---|
| GitHub API client | `octokit` (`@octokit/rest`) |
| Secret/pattern redaction before LLM calls | small internal regex-based scanner (common key/token patterns) — flag as a build task, no off-the-shelf dependency assumed |
| `.gitignore`-aware file filtering | `ignore` npm package |

## Decisions still open
- Public-only vs. private-repo support in v1 (affects OAuth scope — see PRD § 10).
- Whether background jobs run on the same infra as the main app or a separate service from day one.
- Firestore vs. Postgres if relational queries over interview/roadmap history become a need (e.g., complex filtering/aggregation on the dashboard).
