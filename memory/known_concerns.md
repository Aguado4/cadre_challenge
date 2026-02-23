# Known Concerns & Gotchas

## Database
- SQLite does not enforce foreign keys by default — must enable with `PRAGMA foreign_keys = ON` in each connection
- When switching to PostgreSQL, change `DATABASE_URL` in `.env` and update `database.py` driver
- Denormalized counts (likes_count, followers_count) must always be updated atomically with the triggering action

## Authentication
- JWT secret must be long and random — never hardcode, always load from `.env`
- Token expiry should be configurable via env var
- Refresh token flow is out of scope for now (access token only)

## CORS
- Backend must allow `http://localhost:5173` (Vite dev server) during development
- In production, restrict to actual domain

## Frontend
- Vite proxy config routes `/api` requests to FastAPI at `localhost:8000`
- Axios instance should attach `Authorization: Bearer <token>` header automatically
- Optimistic UI updates (e.g., likes) must rollback on API error

## Pydantic v2
- Use `model_config = ConfigDict(from_attributes=True)` instead of `orm_mode = True` (Pydantic v1 syntax)
- `@validator` is deprecated — use `@field_validator` in v2

## SQLAlchemy 2.x
- Use `select()` statements (2.x style) rather than `session.query()` (1.x style)
- `AsyncSession` preferred for async FastAPI; ensure `create_async_engine` is used
