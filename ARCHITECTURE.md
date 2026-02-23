# CadreBook — Architecture Document

> A minimal social network (Facebook circa 2004) built with FastAPI + React + Vite + SQLite/SQLAlchemy.
> This document covers how the system is designed, why it was designed that way, and what trade-offs were made.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Claude Code Setup](#2-claude-code-setup)
3. [System Architecture](#3-system-architecture)
4. [Backend Architecture](#4-backend-architecture)
5. [Frontend Architecture](#5-frontend-architecture)
6. [API Structure](#6-api-structure)
7. [Data Model](#7-data-model)
8. [Authentication & Security](#8-authentication--security)
9. [Error Handling](#9-error-handling)
10. [Denormalization & Scaling Trade-offs](#10-denormalization--scaling-trade-offs)
11. [Separation of Concerns](#11-separation-of-concerns)
12. [Development Setup & Tooling](#12-development-setup--tooling)

---

## 1. Project Overview

CadreBook is a minimal social network that covers the core features of early social media: accounts, profiles, posts, likes, comments, follows, and user discovery. The design philosophy is **few working features over many broken ones** — every phase shipped only when tests passed and the user approved.

**Core features delivered:**

| Phase | Feature |
|-------|---------|
| 1 | Project scaffolding, health check |
| 2 | Authentication (register, login, JWT) |
| 3 | User profiles (view, edit) |
| 4 | Posts (create, feed, edit, delete) |
| 5 | Likes (toggle, optimistic UI) |
| 6 | Comments (add, delete, live counter) |
| 7 | Follow system (follow/unfollow, filtered feed) |
| 8 | User search (by username or display name) |

---

## 2. Claude Code Setup

CadreBook was built entirely using Claude Code as the development agent. Three configuration files govern how Claude operates on this project.

### 2.1 CLAUDE.md

`CLAUDE.md` is the primary instruction file. Claude reads it at the start of every session and uses it to ensure consistency across conversations. It defines:

- Tech stack and key dependencies
- File structure conventions
- Coding standards (naming, architecture pattern, error format)
- SOLID principles and ACID requirements
- The design system (colors, app name)
- Seed data specification

This is the single source of truth for "how this project should be built."

### 2.2 plan.md

`plan.md` is the phased delivery roadmap. Each phase has a clear goal, a list of files to create or modify, and a test acceptance criteria. The workflow per phase is strict:

```
Implement → Present review table → Provide test steps
    → User approves → git commit + push → Next phase
```

This prevents speculative work and ensures every commit is intentional and verified.

### 2.3 Memory System

`memory/MEMORY.md` and `memory/known_concerns.md` persist context across sessions. Because LLM conversations have a context window limit, important decisions are written to memory files so they survive session resets. This includes:

- Key architecture decisions already made
- Important file paths
- Known issues and gotchas (e.g., `create_all` doesn't ALTER existing tables)
- User preferences (approval workflow, no auto-commits)

### 2.4 Sub-Agent Strategy

Each phase launches parallel sub-agents to implement backend and frontend simultaneously, cutting development time roughly in half. The agent type used is `general-purpose` (which has access to Read, Write, Edit, Glob, Grep, and Bash tools).

```
Main Claude session
    ├── Backend sub-agent  ──→ models, schemas, services, routers
    └── Frontend sub-agent ──→ pages, components, API calls
```

Both agents receive their full context in the prompt (file paths, exact code to write, rules to follow). The main session then reads the produced files to verify correctness before presenting to the user.

---

## 3. System Architecture

### 3.1 High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│                                                         │
│   React + Vite SPA  (localhost:5173)                    │
│   ┌─────────────────────────────────────────────────┐   │
│   │  AuthContext  →  Pages  →  Components           │   │
│   │  api/ (Axios) ──────────────────────────────────┼───┼──→ /api/*
│   └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                              │
                    Vite proxy /api → :8000
                              │
┌─────────────────────────────▼───────────────────────────┐
│                    FastAPI Backend                       │
│                  (localhost:8000)                        │
│                                                         │
│   main.py                                               │
│     ├── CORS middleware                                 │
│     ├── Global exception handler                        │
│     └── Routers                                         │
│           ├── /auth          auth_service               │
│           ├── /users         user_service               │
│           ├── /posts         post_service               │
│           ├── /posts/.../like  like_service             │
│           ├── /posts/.../comments  comment_service      │
│           └── /users/.../follow  follower_service       │
│                                                         │
│   core/                                                 │
│     ├── security.py    (JWT, bcrypt)                    │
│     ├── dependencies.py (get_db, get_current_user)      │
│     └── exceptions.py  (AppError hierarchy)            │
└─────────────────────────────────────────────────────────┘
                              │
                     SQLAlchemy ORM
                              │
┌─────────────────────────────▼───────────────────────────┐
│                   SQLite (dev)                          │
│              PostgreSQL-ready schema                    │
│                                                         │
│   users  posts  comments  likes  followers              │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Request Lifecycle

```
Browser
  │
  │  HTTP request (with Bearer token)
  ▼
Vite Dev Server
  │  Proxy: /api/* → localhost:8000/*
  ▼
FastAPI (uvicorn)
  │
  ├── CORS middleware checks origin
  │
  ├── Router matches path + method
  │     └── Injects dependencies:
  │           ├── get_db()              → SQLAlchemy Session
  │           ├── get_current_user()    → User (or 401)
  │           └── get_optional_current_user() → User | None
  │
  ├── Router calls service function
  │     └── Service performs business logic
  │           ├── Validates domain rules
  │           ├── Reads/writes DB via Session
  │           └── Raises AppError on failure
  │
  ├── Service returns Pydantic schema
  │
  └── Router serializes → JSON response
        │
        ▼ (on AppError)
      Global exception handler → structured JSON error
```

---

## 4. Backend Architecture

### 4.1 Layer Pattern: Router → Service → Model

The backend is organized into three distinct layers. Each layer has a single, well-defined responsibility and never crosses into another layer's domain.

```
┌──────────────────────────────────────────────────────────┐
│  ROUTER  (routers/*.py)                                  │
│  • Parses HTTP request                                   │
│  • Injects dependencies (db, current_user)              │
│  • Calls exactly one service function                    │
│  • Returns service result as HTTP response               │
│  • Contains ZERO business logic                          │
├──────────────────────────────────────────────────────────┤
│  SERVICE  (services/*.py)                                │
│  • All business logic lives here                         │
│  • Validates domain rules (ownership, uniqueness, etc.)  │
│  • Orchestrates DB reads and writes                      │
│  • Manages transaction boundaries (db.commit())          │
│  • Raises domain exceptions (e.g. ForbiddenError)       │
│  • Returns typed Pydantic response objects               │
├──────────────────────────────────────────────────────────┤
│  MODEL  (models/*.py)                                    │
│  • SQLAlchemy ORM class definitions only                 │
│  • Column types, constraints, indexes                    │
│  • Relationship declarations                             │
│  • Contains ZERO logic                                   │
└──────────────────────────────────────────────────────────┘
```

**Why this matters:** A router that calls `db.query(...)` directly mixes HTTP concerns with DB concerns. If the query logic needs to change (e.g., add a filter or join), you have to find it scattered across HTTP handlers. With services, there's always one place to look.

### 4.2 Schemas (Pydantic v2)

Schemas sit alongside but separate from models. Each resource has its own schema file:

```
schemas/
  user.py    → UserCreate, UserLogin, ProfileUpdate, ProfileResponse,
                UserResponse, UserSearchResult, AuthResponse, TokenData
  post.py    → PostCreate, PostUpdate, PostAuthor, PostResponse
  comment.py → CommentCreate, CommentAuthor, CommentResponse
  like.py    → LikeResponse
  follower.py → FollowResponse
```

Schemas serve two roles:
- **Input validation** (Pydantic validators, field constraints)
- **Output serialization** (`model_config = ConfigDict(from_attributes=True)` reads from ORM objects)

They never touch the database. The ORM model is never returned directly from a router — always a Pydantic schema.

### 4.3 Dependency Injection

FastAPI's `Depends()` system is used throughout. The key dependencies are defined in `core/dependencies.py`:

```python
# Provides a DB session scoped to the request
def get_db() -> Session

# Requires a valid Bearer token, returns the User or raises 401
def get_current_user(...) -> User

# Returns User if token present and valid, None if not authenticated
def get_optional_current_user(...) -> User | None
```

This design means:
- Routes that require auth declare `current_user: User = Depends(get_current_user)`
- Routes where auth is optional declare `current_user: User | None = Depends(get_optional_current_user)`
- The DB session is never manually created inside a route or service
- Testing could swap `get_db` for a test database via FastAPI's dependency override system

### 4.4 Configuration

`config.py` uses Pydantic's `BaseSettings` to load environment variables with type safety:

```python
class Settings(BaseSettings):
    database_url: str          # e.g. sqlite:///./cadrebook.db
    secret_key: str            # JWT signing secret
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    model_config = {"env_file": ".env"}
```

No secret ever appears in source code. `.env` is gitignored; `.env.example` ships with safe placeholder values.

---

## 5. Frontend Architecture

### 5.1 Structure

```
src/
  main.jsx              Entry point, mounts <App> inside <AuthProvider>
  App.jsx               React Router routes, ProtectedRoute wrappers

  context/
    AuthContext.jsx      Global auth state (user object, login, logout)

  api/
    axios.js            Axios instance with base URL + token interceptor
    auth.js             register, login, getMe
    users.js            getProfile, updateProfile, searchUsers
    posts.js            getFeed, createPost, updatePost, deletePost
    comments.js         getComments, addComment, deleteComment
    likes.js            toggleLike
    followers.js        followUser, unfollowUser

  pages/
    LoginPage.jsx
    RegisterPage.jsx
    FeedPage.jsx         Post feed with filter toggle (All / Following)
    ProfilePage.jsx      View + edit profile, follow button
    SearchPage.jsx       User search with follow/unfollow per result
    NotFoundPage.jsx

  components/
    Navbar.jsx           Top nav: CadreBook logo, Search, @username, Logout
    PostCard.jsx         Individual post: content, edit/delete, like, comments
    CommentSection.jsx   Expandable comment list + add form
    ProtectedRoute.jsx   Redirects to /login if not authenticated
```

### 5.2 Auth Context

`AuthContext` is the single source of auth truth for the entire frontend:

```
App mounts
  └── AuthProvider wraps all routes
        ├── On mount: read token from localStorage
        │     └── If token exists: call GET /auth/me
        │           ├── Success: set user state → app renders
        │           └── Failure: remove token → treat as logged out
        │
        ├── login(token, userData): save to localStorage + state
        └── logout(): remove from localStorage + clear state
```

This means page refreshes restore the session without re-login. If the token is expired or invalid, the backend returns 401, the client removes the stale token, and `ProtectedRoute` redirects to `/login`.

### 5.3 API Layer

All HTTP calls go through a single Axios instance (`api/axios.js`):

```javascript
const api = axios.create({ baseURL: '/api' })

// Automatically attaches JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
```

The `/api` base URL is proxied to `localhost:8000` by Vite during development (`vite.config.js`), so the frontend never hardcodes the backend port. In production, a reverse proxy (nginx, Caddy) would perform the same routing.

### 5.4 Optimistic UI

Several interactions update the UI before the server confirms, then roll back on failure. This makes the app feel instant.

**Like button:**
```
Click → toggle liked state + adjust count locally
       → call API
       → on success: update with server-confirmed values
       → on error: revert to previous state
```

**Follow button (Profile + Search):**
```
Click → toggle isFollowing + adjust followersCount locally
       → call API
       → on success: server values win
       → on error: revert
```

**Comment counter:**
- `CommentSection` calls `onCommentAdded()` / `onCommentDeleted()` callbacks
- `PostCard` holds `commentsCount` state, increments/decrements via those callbacks

---

## 6. API Structure

### 6.1 Endpoint Map

```
Authentication
  POST   /auth/register          Create account
  POST   /auth/login             Login, returns JWT
  GET    /auth/me                Returns current user (requires auth)

Users
  GET    /users/search?q=        Search users by username or display name
  GET    /users/{username}       Get profile (is_following if authenticated)
  PUT    /users/me/profile       Update own profile

Posts
  GET    /posts/feed             Get feed (optional: ?following=true)
  POST   /posts                  Create post
  PUT    /posts/{id}             Edit own post
  DELETE /posts/{id}             Delete own post

Likes
  POST   /posts/{id}/like        Toggle like (like if not liked, unlike if liked)

Comments
  GET    /posts/{id}/comments    Get all comments for a post
  POST   /posts/{id}/comments    Add a comment
  DELETE /comments/{id}          Delete own comment

Follows
  POST   /users/{username}/follow    Follow a user
  DELETE /users/{username}/follow    Unfollow a user

Health
  GET    /health                 Returns {"status": "ok"}
```

### 6.2 Response Format Convention

All success responses return the created/updated resource or a structured object. All error responses return:

```json
{ "detail": "Human-readable error message" }
```

Pydantic v2 validation errors return the FastAPI default format:

```json
{
  "detail": [
    { "loc": ["body", "content"], "msg": "Post content cannot be empty", "type": "value_error" }
  ]
}
```

### 6.3 HTTP Status Code Semantics

| Code | When used |
|------|-----------|
| 200  | Successful GET, PUT, DELETE |
| 201  | Resource created (POST) |
| 400  | Bad request (default AppError) |
| 401  | Not authenticated (missing/invalid/expired token) |
| 403  | Authenticated but not authorized (e.g., editing someone else's post) |
| 404  | Resource not found |
| 409  | Conflict (duplicate username or email) |
| 422  | Pydantic validation error (malformed input) |

---

## 7. Data Model

### 7.1 Entity Relationship Diagram

```
┌──────────────┐         ┌──────────────┐
│    users     │         │    posts     │
├──────────────┤         ├──────────────┤
│ id (PK)      │──┐  ┌──│ id (PK)      │
│ username     │  │  │  │ user_id (FK) │
│ email        │  │  │  │ content      │
│ hashed_pw    │  │  │  │ created_at   │
│ created_at   │  │  │  │ updated_at   │
│ display_name │  │  │  │ likes_count* │
│ bio          │  │  │  │ comments_cnt*│
│ sex          │  │  │  └──────────────┘
│ birthday     │  │  │        │
│ rel_status   │  │  │        │
│ followers_ct*│  │  │  ┌─────▼────────┐
│ following_ct*│  │  │  │   comments   │
└──────────────┘  │  │  ├──────────────┤
       │          │  │  │ id (PK)      │
       │          │  │  │ post_id (FK) │──→ posts.id
       │          │  │  │ user_id (FK) │──→ users.id
       │          │  │  │ content      │
       │          │  │  │ created_at   │
       │          │  │  └──────────────┘
       │          │  │
       │          │  │  ┌──────────────┐
       │          │  │  │    likes     │
       │          │  │  ├──────────────┤
       │          │  └──│ user_id (FK) │
       │          └─────│ post_id (FK) │──→ posts.id
       │                │ UNIQUE(user_id, post_id)
       │                └──────────────┘
       │
       │          ┌──────────────┐
       │          │  followers   │
       │          ├──────────────┤
       └──────────│ follower_id  │ (who is following)
       └──────────│ followed_id  │ (who is being followed)
                  │ UNIQUE(follower_id, followed_id)
                  └──────────────┘

* denormalized counter — see Section 10
```

### 7.2 Model Descriptions

**users** — Core identity. Stores credentials and profile fields. Has denormalized `followers_count` and `following_count` to avoid counting the `followers` table on every profile load.

**posts** — User-authored text posts (max 1000 chars). Has denormalized `likes_count` and `comments_count` updated atomically with every like/comment action.

**comments** — Flat comment thread per post. No nesting. Ordered by `created_at` ascending.

**likes** — Join table between users and posts with a `UNIQUE(user_id, post_id)` constraint enforced at the DB level. Prevents double-likes at the database layer, not just application layer.

**followers** — Self-referential join on users. `UNIQUE(follower_id, followed_id)` prevents duplicate follows. Both FK columns have `ondelete="CASCADE"` so deleting a user cleans up all follow relationships automatically.

### 7.3 Cascade Delete Strategy

Every FK that references `users.id` uses `ondelete="CASCADE"`. Deleting a user removes:
- All their posts
- All their comments (directly + via posts)
- All their likes
- All follow relationships (both directions)

This is declared at both the SQLAlchemy relationship level (`cascade="all, delete-orphan"`) and the FK constraint level (`ondelete="CASCADE"`) to work correctly whether SQLAlchemy or raw SQL triggers the delete.

SQLite FK enforcement is explicitly enabled on every connection:
```python
cursor.execute("PRAGMA foreign_keys=ON")
```
Without this pragma, SQLite silently ignores FK constraints.

---

## 8. Authentication & Security

### 8.1 Flow

```
Registration
  Client POST /auth/register { username, email, password }
    │
    ├── Validate: username regex, email format, password ≥ 8 chars
    ├── Check: username not taken → 409 if taken
    ├── Check: email not taken → 409 if taken
    ├── Hash password with bcrypt (work factor ~12)
    ├── Insert User row
    └── Return AuthResponse { access_token, token_type, user }

Login
  Client POST /auth/login { username, password }
    │
    ├── Look up user by username → 401 if not found
    ├── bcrypt.checkpw(plain, hashed) → 401 if mismatch
    └── Return AuthResponse { access_token, token_type, user }

Authenticated Request
  Client GET /posts/feed  (Authorization: Bearer <token>)
    │
    ├── HTTPBearer extracts token
    ├── jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    │     └── Raises ValueError if expired or invalid
    ├── Load User by id from DB → 401 if not found
    └── Inject User into route handler
```

### 8.2 JWT Design

Tokens contain a minimal payload:

```json
{ "sub": "42", "exp": 1712345678 }
```

`sub` is the user's integer ID as a string (JWT standard field). The expiry is set to 60 minutes by default (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES` in `.env`).

**Why no refresh tokens?** For this scope, a 60-minute expiry with localStorage persistence is sufficient. Refresh tokens add significant complexity (rotation, revocation, secure storage) that isn't warranted for an MVP.

### 8.3 Password Hashing

`passlib` was dropped in favor of the `bcrypt` library directly, because `passlib 1.7.4` is incompatible with `bcrypt 4.x+` (an internal method it calls was removed). The implementation is minimal and correct:

```python
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
```

bcrypt's `gensalt()` uses a random salt per hash by default, so two users with the same password produce different hashes.

### 8.4 Optional Authentication

Some endpoints are useful both authenticated and unauthenticated (e.g., viewing a profile). For these, `get_optional_current_user` returns `None` instead of raising a 401:

```python
optional_bearer_scheme = HTTPBearer(auto_error=False)

def get_optional_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_bearer_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    if not credentials:
        return None
    try:
        user_id = decode_access_token(credentials.credentials)
        return db.get(User, user_id)
    except Exception:
        return None
```

When `current_user` is `None`, the service omits personalized data like `is_following` or `liked_by_me`.

---

## 9. Error Handling

### 9.1 Exception Hierarchy

All application errors inherit from `AppError`, which carries an HTTP status code:

```
Exception
  └── AppError(message, status_code)
        ├── UserNotFoundError          404
        ├── PostNotFoundError          404
        ├── CommentNotFoundError       404
        ├── UsernameAlreadyExistsError 409
        ├── EmailAlreadyExistsError    409
        ├── InvalidCredentialsError    401
        ├── UnauthorizedError          401
        └── ForbiddenError             403
```

### 9.2 Global Handler

A single exception handler registered on the FastAPI app converts every `AppError` into a consistent JSON response:

```python
@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message},
    )
```

This means services never deal with HTTP. They raise a domain exception; the framework converts it. The service layer is completely decoupled from HTTP status codes.

### 9.3 Validation Errors

Pydantic v2 validation errors (malformed input, constraint violations) are returned by FastAPI automatically as HTTP 422 with a list of field-level error objects. Custom `@field_validator` decorators produce human-readable messages:

```python
@field_validator("content")
@classmethod
def validate_content(cls, v: str) -> str:
    v = v.strip()
    if len(v) == 0:
        raise ValueError("Post content cannot be empty")
    if len(v) > 1000:
        raise ValueError("Post content must be at most 1000 characters")
    return v
```

### 9.4 Frontend Error Handling

API errors are caught in each component and displayed inline (never as browser alerts). The pattern:

```javascript
try {
  const res = await someApiCall()
  // handle success
} catch (err) {
  const detail = err.response?.data?.detail
  setError(Array.isArray(detail) ? detail[0]?.msg : (detail ?? 'Something went wrong'))
}
```

This handles both Pydantic validation arrays and single `AppError` strings with the same code.

---

## 10. Denormalization & Scaling Trade-offs

### 10.1 The Problem

The naive approach to showing "42 likes" on a post is:

```sql
SELECT COUNT(*) FROM likes WHERE post_id = 42
```

This is fine with 100 users. At scale, this query runs on every feed page load, multiplied by every post on the page. On a feed showing 20 posts, that's 20 `COUNT(*)` queries per request.

### 10.2 The Solution: Denormalized Counters

CadreBook stores counts directly on the parent row:

| Table | Denormalized columns |
|-------|---------------------|
| posts | `likes_count`, `comments_count` |
| users | `followers_count`, `following_count` |

Reading a feed with 20 posts fetches 20 rows from `posts` — no extra queries for counts.

### 10.3 Atomicity Guarantee

The counter must never drift from the actual data. Every mutation commits the data change and the count change in a single transaction:

```python
# Like a post — atomic: both happen or neither does
db.add(Like(user_id=user.id, post_id=post_id))
post.likes_count += 1
db.commit()                   # ← single commit
```

```python
# Delete a comment — atomic
db.delete(comment)
post.comments_count = max(0, post.comments_count - 1)
db.commit()                   # ← single commit
```

`max(0, ...)` guards prevent the counter going negative due to any data inconsistency.

### 10.4 Trade-offs

| Concern | Denormalized approach |
|---------|----------------------|
| Read performance | Excellent — count is on the row, no JOIN |
| Write complexity | Slightly higher — two writes per action |
| Consistency | Guaranteed if all mutations go through the service layer |
| Risk | If someone writes directly to the DB (bypassing services), counts drift |
| Recovery | A background job can reconcile counts with `COUNT(*)` if drift is detected |

For the current scale (SQLite, single server), this is a clear win with no meaningful downside.

### 10.5 `liked_by_me` Pattern

The feed endpoint can't store per-user state on the post row. Instead, `post_service.get_feed` fetches liked post IDs in a single bulk query after loading the posts:

```python
posts = db.scalars(select(Post)...).all()
post_ids = [p.id for p in posts]

# One query for all liked IDs — not N queries
liked_ids = set(db.scalars(
    select(Like.post_id).where(
        Like.user_id == current_user_id,
        Like.post_id.in_(post_ids),
    )
).all())

return [_to_response(p, liked_ids) for p in posts]
```

This is O(2) queries for a feed of any size, rather than O(N+1).

---

## 11. Separation of Concerns

### 11.1 Backend Boundaries

```
┌─────────────────────────────────────────────────┐
│ HTTP Layer (routers/)                           │
│ Knows about: HTTP verbs, status codes, Depends  │
│ Does NOT know about: SQL, bcrypt, business rules│
└────────────────────────┬────────────────────────┘
                         │ calls service(db, user, data)
┌────────────────────────▼────────────────────────┐
│ Business Logic Layer (services/)                │
│ Knows about: domain rules, DB session           │
│ Does NOT know about: HTTP, Pydantic, FastAPI    │
└────────────────────────┬────────────────────────┘
                         │ reads/writes ORM objects
┌────────────────────────▼────────────────────────┐
│ Data Layer (models/)                            │
│ Knows about: table structure, column types      │
│ Does NOT know about: business rules, HTTP       │
└─────────────────────────────────────────────────┘
```

### 11.2 Frontend Boundaries

```
┌─────────────────────────────────────────────────┐
│ Pages (pages/)                                  │
│ Own: data fetching, page-level state            │
│ Delegate to: components for rendering          │
└────────────────────────┬────────────────────────┘
                         │ passes props + callbacks
┌────────────────────────▼────────────────────────┐
│ Components (components/)                        │
│ Own: UI rendering, local interaction state      │
│ Do NOT: fetch data themselves (except           │
│   CommentSection which owns its own list)       │
└────────────────────────┬────────────────────────┘
                         │ calls
┌────────────────────────▼────────────────────────┐
│ API Layer (api/)                                │
│ Own: HTTP calls, URL construction               │
│ Do NOT: contain UI logic or state               │
└─────────────────────────────────────────────────┘
```

### 11.3 Why `CommentSection` Owns Its Own Data

`CommentSection` is an exception to the "pages fetch, components render" rule. It is an isolated, self-contained feature that loads lazily when the user expands a post. Having `FeedPage` own comment state for all posts would require loading all comments upfront — expensive and unnecessary. The component fetches on first render and owns its list.

Count synchronization between `CommentSection` and its parent `PostCard` is done via callbacks:

```
PostCard holds:    commentsCount state
CommentSection:    onCommentAdded()  → PostCard increments
                   onCommentDeleted() → PostCard decrements
```

---

## 12. Development Setup & Tooling

### 12.1 Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy and fill in environment variables
cp .env.example .env

# Start the server
uvicorn main:app --reload

# Seed test data (first run or after deleting DB)
python seed.py
```

**Important:** Always run uvicorn from inside the activated venv. Running from system Python will fail if dependencies aren't globally installed.

**Schema changes:** `Base.metadata.create_all()` runs on startup but **does not ALTER existing tables**. If you add a column to a model, delete `cadrebook.db` and restart. The seed script is idempotent and safe to re-run.

### 12.2 Frontend Setup

```bash
cd frontend
npm install
npm run dev       # starts at localhost:5173
```

The Vite dev server proxies `/api/*` → `localhost:8000` so no CORS issues in development.

### 12.3 Seed Users

All seed users have password `password123`:

| Username | Display Name | Notes |
|----------|-------------|-------|
| eliana | Eliana Perez | she/her, coffee addict |
| chad | Chad Lohrli | gym + startups |
| dhruv | Dhruv Kanetkar | ML engineer, chess |
| juan | Juan Aguado | full-stack, always shipping |

### 12.4 Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | SQLAlchemy connection string | `sqlite:///./cadrebook.db` |
| `SECRET_KEY` | JWT signing secret (keep long and random) | `openssl rand -hex 32` |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime | `60` |

### 12.5 PostgreSQL Migration Path

The schema is designed to be PostgreSQL-compatible. To migrate:

1. Change `DATABASE_URL` to `postgresql://user:pass@host/dbname`
2. Remove the `connect_args={"check_same_thread": False}` SQLite-specific argument from `database.py`
3. Remove the `PRAGMA foreign_keys=ON` event listener (PostgreSQL enforces FKs natively)
4. Run Alembic (or `create_all`) against the new database

No model changes are required. All column types, constraints, and relationships are standard SQL.

---

*Document generated from source code inspection and development session history.*
*Last updated: Phase 8 (User Search) — CadreBook v1.0.0*
