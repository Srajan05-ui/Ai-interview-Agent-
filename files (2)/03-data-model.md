# Core Data Model

> Proposed entities. Field names/types are suggestions — align with whatever
> ORM/DB Antigravity scaffolds.

## User
| Field | Type | Notes |
|---|---|---|
| id | string | Firebase UID |
| name, email, avatarUrl | string | from OAuth provider |
| targetRole, experienceLevel | string | optional profile fields |
| githubConnected | boolean | new — see doc 04 |
| githubAccessTokenRef | string | pointer to encrypted secret, not the token itself |
| createdAt | timestamp | |

## Resume
| Field | Type |
|---|---|
| id, userId | string |
| fileUrl | string |
| atsScore | number (0–100) |
| feedback | JSON (section-level + bullet-level) |
| createdAt | timestamp |

## Interview
| Field | Type |
|---|---|
| id, userId | string |
| config | JSON (language, mode, companyStyle, role) |
| transcript | JSON[] (turn: role, text, timestamp, codeSnapshot?) |
| antiCheatFlags | JSON[] (type, timestamp) |
| status | enum: setup, in_progress, completed |
| createdAt, completedAt | timestamp |

## Scorecard
| Field | Type |
|---|---|
| id, interviewId | string |
| rubricScores | JSON (topic → score) |
| strongAreas, weakAreas | string[] |
| citedFeedback | JSON[] (text, transcriptTurnRef) |

## Roadmap
| Field | Type |
|---|---|
| id, userId | string |
| sourceScorecardId / sourceRepoAnalysisId | string, nullable |
| steps | JSON[] (topic, resourceLinks, estimatedTime, completed) |

## RepoAnalysis (new — see doc 04)
| Field | Type |
|---|---|
| id, userId | string |
| repoUrl, repoName, defaultBranch | string |
| languages | JSON (language → % of codebase) |
| overallScore | number (0–100) |
| categoryScores | JSON (codeQuality, structure, testing, docs, security, etc.) |
| suggestions | JSON[] (category, severity, filePath, description, suggestedFix) |
| status | enum: queued, analyzing, completed, failed |
| createdAt, completedAt | timestamp |
