# CadreBook

A minimal social network inspired by early Facebook — built with **FastAPI + React + Vite + SQLite**.

Users can register, set up a profile, post status updates, like and comment on posts, follow other users, and search for people by name.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Running the App](#running-the-app)
- [Seed Data](#seed-data)
- [Manual Testing Guide](#manual-testing-guide)
- [API Reference](#api-reference)
- [Understanding the Codebase](#understanding-the-codebase)
- [Extending the Codebase](#extending-the-codebase)
- [Design System](#design-system)
- [Known Gotchas](#known-gotchas)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend framework | FastAPI 0.111 |
| ORM | SQLAlchemy 2.x |
| Database | SQLite (dev) — PostgreSQL-ready |
| Validation | Pydantic v2 |
| Auth | JWT (python-jose) + bcrypt |
| Frontend | React 19 + Vite 7 |
| Routing | React Router v7 |
| HTTP client | Axios |
| Styling | TailwindCSS 3 |
| Server | Uvicorn (ASGI) |

---

## Quick Start

You need **Python 3.11+** and **Node.js 18+**.

### 1. Clone and set up the backend

```bash
cd backend
python -m venv venv

# Activate (Mac/Linux)
source venv/bin/activate
# Activate (Windows)
venv\Scripts\activate

pip install -r requirements.txt

# Create your environment file
cp .env.example .env
# Edit .env — set a real SECRET_KEY (see below)
```

Minimum `.env` contents:

```
DATABASE_URL=sqlite:///./cadrebook.db
SECRET_KEY=your-secret-key-here-make-it-long-and-random
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

Generate a secure key with: `python -c "import secrets; print(secrets.token_hex(32))"`

### 2. Start the backend

```bash
# From inside backend/ with venv active
uvicorn main:app --reload
```

The API is now running at `http://localhost:8000`. The SQLite database is created automatically on first start.

### 3. Set up and start the frontend

```bash
cd frontend
npm install
npm run dev
```

The app is now running at `http://localhost:5173`.

### 4. Seed test data (recommended)

```bash
# From inside backend/ with venv active
python seed.py
```

This creates four users with posts, follows, and likes between them. Safe to re-run — skips existing users.

---

## Project Structure

```
cadre_challenge/
├── CLAUDE.md              Claude Code instructions (coding standards, arch rules)
├── plan.md                Phased delivery plan
├── ARCHITECTURE.md        Deep-dive architecture document
├── README.md              This file
│
├── backend/
│   ├── main.py            FastAPI app, middleware, router registration
│   ├── database.py        SQLAlchemy engine, session, Base
│   ├── config.py          Pydantic settings loaded from .env
│   ├── seed.py            Dev data seeder
│   ├── requirements.txt
│   ├── .env               Local secrets (gitignored)
│   ├── .env.example       Safe template to copy
│   │
│   ├── models/            SQLAlchemy ORM table definitions
│   │   ├── user.py
│   │   ├── post.py
│   │   ├── comment.py
│   │   ├── like.py
│   │   └── follower.py
│   │
│   ├── schemas/           Pydantic request/response schemas
│   │   ├── user.py
│   │   ├── post.py
│   │   ├── comment.py
│   │   ├── like.py
│   │   └── follower.py
│   │
│   ├── routers/           Thin HTTP handlers — no business logic
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── posts.py
│   │   ├── comments.py
│   │   ├── likes.py
│   │   └── followers.py
│   │
│   ├── services/          All business logic lives here
│   │   ├── auth_service.py
│   │   ├── user_service.py
│   │   ├── post_service.py
│   │   ├── comment_service.py
│   │   ├── like_service.py
│   │   └── follower_service.py
│   │
│   └── core/
│       ├── security.py       JWT encode/decode, bcrypt hash/verify
│       ├── dependencies.py   get_db, get_current_user, get_optional_current_user
│       └── exceptions.py     AppError hierarchy + global handler
│
└── frontend/
    ├── vite.config.js     Vite config — proxies /api → localhost:8000
    ├── tailwind.config.js Custom colors (cadre-red, cadre-dark, etc.)
    └── src/
        ├── main.jsx       Entry point
        ├── App.jsx        Routes + ProtectedRoute wrappers
        ├── context/
        │   └── AuthContext.jsx  Global auth state, localStorage persistence
        ├── api/           One file per resource — all Axios calls
        │   ├── axios.js   Shared instance with token interceptor
        │   ├── auth.js
        │   ├── users.js
        │   ├── posts.js
        │   ├── comments.js
        │   ├── likes.js
        │   └── followers.js
        ├── components/    Reusable UI pieces
        │   ├── Navbar.jsx
        │   ├── PostCard.jsx
        │   ├── CommentSection.jsx
        │   └── ProtectedRoute.jsx
        └── pages/         Full-page route targets
            ├── LoginPage.jsx
            ├── RegisterPage.jsx
            ├── FeedPage.jsx
            ├── ProfilePage.jsx
            ├── SearchPage.jsx
            └── NotFoundPage.jsx
```

---

## Running the App

### Backend commands

```bash
# Start server with auto-reload on code changes
uvicorn main:app --reload

# Start on a different port
uvicorn main:app --reload --port 8001

# View auto-generated API docs (interactive Swagger UI)
open http://localhost:8000/docs

# View alternative ReDoc documentation
open http://localhost:8000/redoc

# Health check
curl http://localhost:8000/health
```

### Frontend commands

```bash
npm run dev       # Development server at localhost:5173
npm run build     # Production build to dist/
npm run preview   # Preview production build locally
npm run lint      # ESLint check
```

### Running both together

Open two terminals:

```
Terminal 1 (backend):    cd backend && source venv/bin/activate && uvicorn main:app --reload
Terminal 2 (frontend):   cd frontend && npm run dev
```

Then open `http://localhost:5173`.

---

## Seed Data

The seed script creates four users with realistic profiles, multiple posts, and follow/like relationships between them.

```bash
python seed.py   # run from backend/ with venv active
```

| Username | Password | Display Name | Bio |
|----------|----------|--------------|-----|
| `eliana` | `password123` | Eliana Perez | Coffee addict and aspiring artist |
| `chad` | `password123` | Chad Lohrli | Gym, startups, and hustle culture |
| `dhruv` | `password123` | Dhruv Kanetkar | ML engineer who plays chess at 2am |
| `juan` | `password123` | Juan Aguado | Full-stack dev, always shipping something |

The script is **idempotent** — running it twice won't duplicate data. It skips users that already exist.

> **After any model change:** Delete `backend/cadrebook.db` before re-running `seed.py`. SQLAlchemy's `create_all` adds new tables but does not alter existing ones.

---

## Manual Testing Guide

Use these steps to verify each feature works end-to-end.

### Authentication
1. Go to `http://localhost:5173` — should redirect to `/login`
2. Register a new account with a unique username and email
3. You're logged in automatically — Navbar shows your username
4. Log out → redirected to `/login`
5. Log back in with the same credentials
6. Try registering with the same username → error: "That username is already taken"
7. Refresh the page while logged in → session persists

### Posts & Feed
1. On the Feed page, type a post and click **Post** → appears at the top of the feed
2. Click the **⋯** menu on your own post → Edit and Delete options appear
3. Edit the post content → save → feed updates inline
4. Delete a post → removed from feed instantly
5. On someone else's post → no Edit/Delete options

### Likes
1. Click the ♡ heart on any post → turns red, count increments immediately
2. Click again → unliked, count decrements
3. Refresh → state persists (stored in DB)

### Comments
1. Click the 💬 button on a post → comment section expands
2. Type a comment and click **Post** → appears in the list, counter increments
3. Hover over your own comment → **Delete** button appears
4. Delete it → removed from list, counter decrements
5. Refresh → count is accurate

### Profiles
1. Click your username in the Navbar → your profile page
2. Click **Edit profile** → form appears with all profile fields
3. Fill in bio, sex, birthday, relationship status → click **Save changes**
4. Changes persist on refresh
5. Navigate to another user's profile → Edit button is hidden

### Follow System
1. Go to another user's profile → **Follow** button visible
2. Click Follow → button changes to "Following", follower count increments
3. Go to Feed → click **Following** tab → only that user's posts appear
4. Go back to their profile → click Following → unfollow, count decrements
5. Following feed is now empty again
6. On your own profile → no Follow button

### Search
1. Click **Search** in the Navbar
2. Search `"el"` → Eliana appears
3. Search `"dhr"` → Dhruv appears (username match)
4. Search `"full"` → Juan appears (display name match)
5. Click a result card → navigates to that user's profile
6. Click **Follow** on a result → toggles immediately
7. Search yourself → you do not appear in results

---

## API Reference

All endpoints are prefixed relative to `http://localhost:8000`. Interactive docs at `/docs`.

### Authentication

```
POST /auth/register
  Body: { username, email, password }
  Returns: { access_token, token_type, user }

POST /auth/login
  Body: { username, password }
  Returns: { access_token, token_type, user }

GET  /auth/me                          🔒 requires auth
  Returns: current user object
```

### Users

```
GET  /users/search?q=<query>           🔓 optional auth
  Returns: list of matching users (with is_following if authenticated)

GET  /users/{username}                 🔓 optional auth
  Returns: full profile (with is_following if authenticated)

PUT  /users/me/profile                 🔒 requires auth
  Body: { display_name?, bio?, sex?, birthday?, relationship_status? }
  Returns: updated profile
```

### Posts

```
GET  /posts/feed?skip=0&limit=20&following=false   🔒 requires auth
  Returns: list of posts (with liked_by_me per post)

POST /posts                            🔒 requires auth
  Body: { content }
  Returns: created post

PUT  /posts/{id}                       🔒 requires auth (must own post)
  Body: { content }
  Returns: updated post

DELETE /posts/{id}                     🔒 requires auth (must own post)
  Returns: 204 No Content
```

### Likes

```
POST   /posts/{id}/like                🔒 requires auth
DELETE /posts/{id}/like                🔒 requires auth
  Both return: { liked, likes_count }
```

### Comments

```
GET    /posts/{id}/comments            🔒 requires auth
  Returns: list of comments with author info

POST   /posts/{id}/comments            🔒 requires auth
  Body: { content }
  Returns: created comment

DELETE /comments/{id}                  🔒 requires auth (must own comment)
  Returns: 204 No Content
```

### Follows

```
POST   /users/{username}/follow        🔒 requires auth
DELETE /users/{username}/follow        🔒 requires auth
  Both return: { following, followers_count, following_count }
```

### Error format

All errors return:
```json
{ "detail": "Human-readable message" }
```

---

## Understanding the Codebase

### The core pattern: Router → Service → Model

Every backend feature follows the same three-layer structure:

```
routers/posts.py          ← HTTP: parse request, call service, return response
    ↓ calls
services/post_service.py  ← Logic: validate rules, orchestrate DB writes
    ↓ reads/writes
models/post.py            ← Data: SQLAlchemy ORM column definitions only
```

**A router never touches the DB directly.** A service never deals with HTTP status codes or response serialization. A model never contains logic.

To understand any feature, find its service file — that's where everything interesting happens.

### Following a request end-to-end

Take `POST /posts/{id}/like` as an example:

1. **`routers/likes.py`** — receives the request, injects `db` and `current_user` via `Depends()`, calls `toggle_like(db, current_user.id, post_id)`
2. **`services/like_service.py`** — checks if a Like row exists, deletes or creates it, and updates `post.likes_count` in the **same `db.commit()`** (ACID guarantee)
3. **`models/like.py`** — defines the `likes` table with a `UNIQUE(user_id, post_id)` constraint
4. **`schemas/like.py`** — `LikeResponse` is what the router returns

### Frontend data flow

```
AuthContext (global user state)
    └── Pages fetch data on mount
          └── Pages pass data as props to Components
                └── Components call api/ functions for mutations
                      └── api/axios.js attaches token to every request
```

To understand a page, read the `useEffect` at the top (fetching) and the handlers (mutations).

### Where counts come from

`likes_count`, `comments_count`, `followers_count`, and `following_count` are stored directly on their parent rows and updated atomically on every write. They are **never computed via `COUNT(*)` at read time**. See `ARCHITECTURE.md` §10 for the full rationale.

---

## Extending the Codebase

### Adding a new backend feature

**Example: bookmarking a post**

1. **Model** — `models/bookmark.py`
   ```python
   class Bookmark(Base):
       __tablename__ = "bookmarks"
       __table_args__ = (UniqueConstraint("user_id", "post_id"),)
       id = Column(Integer, primary_key=True)
       user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
       post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"))
   ```

2. **Register** — add `from models.bookmark import Bookmark` to `models/__init__.py`

3. **Schema** — `schemas/bookmark.py`
   ```python
   class BookmarkResponse(BaseModel):
       bookmarked: bool
   ```

4. **Service** — `services/bookmark_service.py`
   ```python
   def toggle_bookmark(db, user_id, post_id) -> BookmarkResponse:
       existing = db.scalar(select(Bookmark).where(...))
       if existing:
           db.delete(existing)
       else:
           db.add(Bookmark(user_id=user_id, post_id=post_id))
       db.commit()
       return BookmarkResponse(bookmarked=existing is None)
   ```

5. **Router** — `routers/bookmarks.py`
   ```python
   router = APIRouter(prefix="/posts", tags=["bookmarks"])

   @router.post("/{post_id}/bookmark", response_model=BookmarkResponse)
   def bookmark(post_id: int, db=Depends(get_db), user=Depends(get_current_user)):
       return toggle_bookmark(db, user.id, post_id)
   ```

6. **Register router** — add `app.include_router(bookmarks_router)` in `main.py`

7. **Delete DB + restart** — `create_all` will add the new `bookmarks` table

### Adding a new frontend page

1. Create `frontend/src/pages/BookmarksPage.jsx`
2. Add an API function in `frontend/src/api/posts.js` (or a new `bookmarks.js`)
3. Add the route in `App.jsx`:
   ```jsx
   <Route path="/bookmarks" element={<ProtectedRoute><BookmarksPage /></ProtectedRoute>} />
   ```
4. Add a link in `Navbar.jsx`

### Adding a field to an existing model

1. Add the column to the model in `models/`
2. Add the field to the relevant Pydantic schema in `schemas/`
3. Update the service to read/write it
4. Delete `cadrebook.db` and restart (SQLAlchemy won't ALTER the existing table)
5. Re-run `python seed.py`

### Switching to PostgreSQL

1. `pip install psycopg2-binary`
2. Update `.env`: `DATABASE_URL=postgresql://user:pass@localhost/cadrebook`
3. In `database.py`, remove the two SQLite-specific lines:
   ```python
   # Remove:
   connect_args={"check_same_thread": False}
   # Remove the @event.listens_for block (PRAGMA foreign_keys)
   ```
4. Restart — `create_all` will create all tables in the new database

For production migrations, replace `create_all` with **Alembic**.

---

## Design System

The UI uses a monochromatic dark theme with a single red accent.

| Token | Value | Used for |
|-------|-------|---------|
| `cadre-red` | `#db4545` | Buttons, likes, active states, links, avatar initials |
| `cadre-dark` | `#111111` | Card backgrounds, navbar |
| `cadre-border` | `#2a2a2a` | Borders, dividers, avatar backgrounds |
| `cadre-muted` | `#a3a3a3` | Secondary text, timestamps, labels |
| `bg-black` | `#000000` | Page background |
| `text-white` | `#ffffff` | Primary text |

These are defined as custom Tailwind colors in `frontend/tailwind.config.js`.

**Reusable utility class:** `.input-field` is defined in `frontend/src/index.css` and applies to all text inputs, textareas, and selects throughout the app.

---

## Known Gotchas

**`create_all` doesn't ALTER tables**
If you add a column to an ORM model, SQLAlchemy will not alter the existing SQLite database. You must delete `cadrebook.db` and restart uvicorn to get a fresh schema. For production, use Alembic migrations.

**Always use the venv**
Run uvicorn from inside the activated virtual environment (`backend/venv`). Running from the system Python will fail with import errors if packages aren't globally installed.

**UTC timestamps**
The backend stores naive UTC datetimes. The frontend's `timeAgo()` function appends `'Z'` to ISO strings before parsing (`iso + 'Z'`) to force UTC interpretation. Without this, JavaScript treats the timestamp as local time and the displayed age is wrong.

**SQLite FK enforcement**
SQLite ignores foreign key constraints by default. `database.py` runs `PRAGMA foreign_keys=ON` on every connection to enable them. This is SQLite-specific and is removed when switching to PostgreSQL.

**`/users/search` must be registered before `/{username}`**
In `routers/users.py`, the `/search` route must appear before `/{username}` in the file. FastAPI matches routes in registration order — if `/{username}` comes first, `/search` would be captured as a username lookup for a user named "search".
