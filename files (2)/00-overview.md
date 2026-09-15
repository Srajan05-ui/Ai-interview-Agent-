# AI Interview Agent — Project Overview

## What this project is
An AI-powered mock interview platform. A candidate uploads their resume, configures
an interview (role, language, technical vs. live coding, target company style),
goes through an adaptive AI-driven interview (voice/text + live coding), and
receives a rubric-based scorecard with a personalized learning roadmap.

This document set is a **build specification** for implementing (or continuing to
implement) the product inside Antigravity. It is not reverse-engineered from an
existing repo — treat file paths and module names below as *proposed*, not
verified, and adjust to match whatever scaffolding Antigravity generates.

## Document index
| Doc | Purpose |
|---|---|
| `prd.md` | Product requirements — problem, goals, scope, success metrics |
| `01-features.md` | Full functional spec of existing/planned features |
| `02-architecture.md` | Proposed system architecture (high-level) |
| `03-data-model.md` | Core entities and relationships |
| `04-feature-github-repo-analysis.md` | Full spec for the new "connect GitHub repo → analyze & score" feature |
| `05-api-reference.md` | REST/API contract for backend endpoints |
| `06-tech-stack.md` | Concrete stack/library choices |
| `07-design.md` | UX/visual design + detailed system design (pipeline, failure handling) |

## Assumptions made (flag these as you build)
- Auth: Firebase Authentication (Google/GitHub OAuth providers) — stated by you.
- Frontend: React/Next.js with TypeScript (implied by `CodeEditorPanel.tsx`).
- No backend framework, database, or LLM provider was specified — `02-architecture.md`
  proposes reasonable defaults you should confirm or swap before scaffolding.
