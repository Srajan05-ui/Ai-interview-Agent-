# API Reference (proposed)

> Contract to implement. Adjust route prefixes to match your framework
> (Next.js API routes, Express, FastAPI, etc.).

## Auth
Handled by Firebase Auth on the client; backend routes below assume a valid
session/ID token is passed and verified server-side.

## Resume
| Method | Route | Body | Response |
|---|---|---|---|
| POST | `/api/resume` | multipart file | `{ resumeId, status }` |
| GET | `/api/resume/{id}` | — | `{ atsScore, feedback }` |

## Interview
| Method | Route | Body | Response |
|---|---|---|---|
| POST | `/api/interview` | `{ config }` | `{ interviewId }` |
| POST | `/api/interview/{id}/answer` | `{ text, codeSnapshot? }` | `{ nextQuestion }` |
| POST | `/api/interview/{id}/complete` | — | `{ scorecardId }` |
| GET | `/api/interview/{id}/scorecard` | — | `Scorecard` |

## Roadmap
| Method | Route | Body | Response |
|---|---|---|---|
| POST | `/api/roadmap` | `{ sourceType: "scorecard"\|"repoAnalysis", sourceId }` | `{ roadmapId }` |
| GET | `/api/roadmap/{id}` | — | `Roadmap` |
| PATCH | `/api/roadmap/{id}/steps/{stepId}` | `{ completed }` | `{ ok: true }` |

## GitHub Repo Analysis (new)
| Method | Route | Body | Response |
|---|---|---|---|
| GET | `/api/github/oauth/start` | — | redirect to GitHub OAuth |
| GET | `/api/github/oauth/callback` | query: `code`, `state` | redirect to dashboard, token stored server-side |
| GET | `/api/github/repos` | — | `{ repos: [{ name, fullName, language, updatedAt }] }` |
| POST | `/api/repo-analysis` | `{ repoUrl, branch?, excludePaths? }` | `{ repoAnalysisId, status: "queued" }` |
| GET | `/api/repo-analysis/{id}` | — | `RepoAnalysis` (see doc 03) incl. `status` |
| POST | `/api/repo-analysis/{id}/send-to-roadmap` | — | `{ roadmapId }` |
| DELETE | `/api/github/connection` | — | `{ ok: true }` — revokes + deletes stored token |

## Error format (all routes)
```json
{
  "error": {
    "code": "REPO_TOO_LARGE",
    "message": "This repo exceeds the file limit for analysis. Try a subfolder or a smaller branch."
  }
}
```
Use specific `code` values (`GITHUB_AUTH_REQUIRED`, `GITHUB_RATE_LIMITED`,
`REPO_NOT_FOUND`, `REPO_TOO_LARGE`, `ANALYSIS_FAILED`, `LLM_RATE_LIMITED`) so
the frontend can show precise messaging instead of a generic error toast.
