# MEMORY.md — CadreBook

## Project Status
- **Current Phase:** Phase 0 complete (pending approval)
- **Last Approved Phase:** None

## Key Architecture Decisions
- Router → Service → Model separation (thin routers, logic in services)
- Pydantic v2 for all input/output validation
- JWT auth with python-jose + bcrypt via passlib
- SQLAlchemy 2.x ORM — SQLite dev, PostgreSQL-ready
- Denormalized `likes_count` on Post, `followers_count`/`following_count` on User
- All multi-step DB writes use explicit transactions for ACID compliance

## Important File Paths
- Backend entry: `backend/main.py`
- DB setup: `backend/database.py`
- Config/env: `backend/config.py` + `backend/.env`
- JWT/auth helpers: `backend/core/security.py`
- DI dependencies: `backend/core/dependencies.py`
- Custom exceptions: `backend/core/exceptions.py`
- Frontend entry: `frontend/src/main.jsx`
- API client: `frontend/src/api/axios.js`
- Auth context: `frontend/src/context/AuthContext.jsx`

## Sub-Agent Notes
- Each phase uses parallel sub-agents where possible (backend / frontend / db)
- Sub-agents should read CLAUDE.md before starting work
- All changes must be presented for user approval before committing

## Known Concerns
- See `memory/known_concerns.md` for open issues and gotchas

## Design System
- App name: **CadreBook**
- Background: #000000 / #111111
- Text: #ffffff / #e5e5e5
- Accent: **#db4545** (red) — buttons, links, likes, active states
- Borders: #2a2a2a
- Tailwind custom color key: `cadre-red`

## Seed Users (all password: `password123`)
- eliana, chad, dhruv, juan
- Seed script: `backend/seed.py`

## User Preferences
- Strict phase approval workflow: implement → review table → test steps → approve → commit → next phase
- Prefer few working features over many broken ones
- SOLID principles throughout
- Readable, human-friendly error messages on all exceptions
