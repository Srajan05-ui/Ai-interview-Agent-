# AI BRAIN — PRIMARY MEMORY

> This is the first file the AI must read before doing any task.
> Do NOT scan the full project unless this file explicitly says more context is needed.

## 1. Project Identity

Project Name: [PROJECT_NAME]
Project Type: [WEB APP / BACKEND / FULL STACK / OTHER]
Primary Goal: [ONE SENTENCE DESCRIPTION]

## 2. Current Tech Stack

Frontend:
- [e.g. React + Vite]
- [e.g. Tailwind CSS]

Backend:
- [e.g. Node.js + Express]

Database:
- [e.g. SQLite / MySQL / PostgreSQL]

Authentication:
- [e.g. JWT + bcrypt]

Other:
- [APIs / AI / storage / deployment]

## 3. Project Structure Summary

Only keep important paths here.

```text
src/
  components/   -> reusable UI
  pages/        -> application pages
  routes/       -> routing
  services/     -> API/business services
backend/
  controllers/  -> request handlers
  routes/       -> API endpoints
  middleware/   -> auth/security
  models/       -> database models
```

Do NOT store entire source files in this memory.

## 4. Important Architecture Decisions

- [Decision 1]
- [Decision 2]
- [Decision 3]

## 5. Existing Features

### Completed
- [Feature]
- [Feature]

### In Progress
- [Feature]

### Planned
- [Feature]

## 6. Important APIs / Routes

| Method | Route | Purpose |
|---|---|---|
| POST | /api/auth/login | Login |
| GET | /api/... | ... |

Only list routes that are useful for future reasoning.

## 7. Database Memory

Main tables:
- users: [important columns]
- applications: [important columns]
- documents: [important columns]

Important relationships:
- [relationship]

Do not copy the complete SQL schema here unless essential.

## 8. Security Rules

- Never expose secrets or `.env`.
- Do not weaken authentication.
- Preserve RBAC.
- Validate inputs.
- Follow existing project security architecture.

## 9. Coding Conventions

- Keep existing folder structure.
- Reuse existing utilities before creating new ones.
- Avoid duplicate components/functions.
- Keep API response format consistent.
- Do not replace working code unless necessary.

## 10. Current Known Issues

- [Issue]
- [Issue]

## 11. Recent Changes

Keep only the last 5–10 meaningful changes.

- [DATE] — [Change]
- [DATE] — [Change]

## 12. Important File Map

Use this to decide what files should be opened.

| Topic | Files |
|---|---|
| Authentication | backend/routes/auth.js, backend/controllers/authController.js |
| Database | backend/db/* |
| Frontend auth | src/context/AuthContext.jsx |
| Dashboard | src/pages/Dashboard.jsx |

## 13. Current Task Context

Current task:
[WHAT WE ARE WORKING ON]

Relevant files:
- [file]
- [file]

Do not open unrelated files.

## 14. Last Session Summary

[5–15 lines describing exactly what was changed, what works, what remains, and any important constraints.]

---

# MEMORY POLICY

1. Read this file first.
2. Do not recursively inspect the whole repository by default.
3. Open only files directly relevant to the requested task.
4. If exact implementation details are missing, inspect the smallest relevant file(s).
5. After completing meaningful work, update:
   - Current Task Context
   - Recent Changes
   - Last Session Summary
   - Important File Map, if needed
6. Remove stale information.
7. Keep this file concise. Target: under ~4,000 tokens.
