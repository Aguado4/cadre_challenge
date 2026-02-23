# CLAUDE.md — CadreBook

## Project Description & Goals

**CadreBook** — a minimal social network inspired by Facebook circa 2004. Users can sign up, create a profile, post status updates, and see a feed of posts from other users. Stretch goals include follows, likes, and comments.

**Priority:** Few working features > many broken ones.

---

## Tech Stack & Key Dependencies

### Backend
- **Python 3.11+**
- **FastAPI** — HTTP framework
- **SQLAlchemy 2.x** — ORM (async-capable, designed for easy swap to PostgreSQL)
- **SQLite** (dev) → PostgreSQL-ready via SQLAlchemy abstraction
- **Pydantic v2** — request/response validation and serialization
- **python-jose** — JWT encoding/decoding
- **passlib[bcrypt]** — password hashing
- **python-dotenv** — environment variable management
- **uvicorn** — ASGI server

### Frontend
- **React 18**
- **Vite** — build tool and dev server
- **React Router v6** — client-side routing
- **Axios** — HTTP client
- **TailwindCSS** — utility-first styling

### Database
- **SQLite** via SQLAlchemy (dev)
- Schema designed for easy migration to PostgreSQL

---

## File Structure Conventions

```
cadre_challenge/
├── CLAUDE.md
├── plan.md
├── memory/
│   └── MEMORY.md
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── database.py              # SQLAlchemy engine and session
│   ├── config.py                # Settings via pydantic BaseSettings
│   ├── models/                  # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── post.py
│   │   ├── comment.py
│   │   ├── like.py
│   │   └── follower.py
│   ├── schemas/                 # Pydantic schemas (request/response)
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── post.py
│   │   ├── comment.py
│   │   ├── like.py
│   │   └── follower.py
│   ├── routers/                 # Thin HTTP layer (routes only)
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── posts.py
│   │   ├── comments.py
│   │   ├── likes.py
│   │   └── followers.py
│   ├── services/                # Business logic layer
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── user_service.py
│   │   ├── post_service.py
│   │   ├── comment_service.py
│   │   ├── like_service.py
│   │   └── follower_service.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── security.py          # JWT helpers, password hashing
│   │   ├── dependencies.py      # FastAPI dependency injection (get_db, get_current_user)
│   │   └── exceptions.py        # Custom exception classes and handlers
│   └── requirements.txt
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── api/                 # Axios instances and API call functions
        │   ├── axios.js
        │   ├── auth.js
        │   ├── users.js
        │   ├── posts.js
        │   ├── comments.js
        │   └── likes.js
        ├── components/          # Reusable UI components
        │   ├── Navbar.jsx
        │   ├── PostCard.jsx
        │   ├── CommentSection.jsx
        │   └── ProtectedRoute.jsx
        ├── pages/               # Page-level components (route targets)
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── FeedPage.jsx
        │   ├── ProfilePage.jsx
        │   └── NotFoundPage.jsx
        ├── context/
        │   └── AuthContext.jsx  # JWT token state, login/logout
        └── hooks/
            └── useAuth.js
```

---

## Coding Standards

### Naming
- **Python:** `snake_case` for variables, functions, files; `PascalCase` for classes
- **JavaScript/JSX:** `camelCase` for variables/functions; `PascalCase` for components
- **Database columns:** `snake_case`
- **API endpoints:** RESTful, plural nouns (`/users`, `/posts`, `/comments`)

### Architecture Pattern: Router → Service → Model
- **Router** (`routers/`): Thin HTTP handlers. Parse request, call service, return response. No business logic.
- **Service** (`services/`): All business logic. Validates rules, orchestrates DB operations. Raises domain exceptions.
- **Model** (`models/`): SQLAlchemy ORM definitions only. No logic.
- **Schema** (`schemas/`): Pydantic models for input validation and output serialization.

### Error Handling
- Raise domain-specific exceptions from services (e.g., `UserNotFoundError`, `InvalidCredentialsError`)
- Register global exception handlers in `core/exceptions.py`
- Always return structured JSON errors: `{"detail": "Human-readable message"}`
- HTTP status codes must be semantically correct (401 vs 403 vs 404 vs 422)

### SOLID Principles
- **S** — Each class/function has one responsibility
- **O** — Use dependency injection and interfaces to extend without modifying
- **L** — Substitutable abstractions (e.g., DB session injectable)
- **I** — Small, focused schemas (no god-objects)
- **D** — Depend on abstractions via FastAPI's `Depends()`

### ACID & Data Integrity
- All multi-step DB operations use explicit transactions
- Denormalize `likes_count` and `followers_count` on the relevant models for read performance
- Any count update must happen atomically with the action itself (like + increment in one transaction)

### Auth
- JWT access tokens with expiry
- Passwords hashed with bcrypt (never stored plain)
- `get_current_user` dependency injected into protected routes

### Design System
- **App name:** CadreBook
- **Color palette:**
  - Background: `#000000` (black) / `#111111` (dark surfaces)
  - Text: `#ffffff` (white) / `#e5e5e5` (muted)
  - Accent / primary action: `#db4545` (red)
  - Borders / dividers: `#2a2a2a`
- **Style:** Monochromatic black-and-white base with `#db4545` used for buttons, links, likes, active states, and highlights
- Define these as Tailwind custom colors in `tailwind.config.js`

### Mock Seed Data
A seed script (`backend/seed.py`) must be provided for dev testing with the following users:
- **Eliana** — username: `eliana`, password: `password123`
- **Chad** — username: `chad`, password: `password123`
- **Dhruv** — username: `dhruv`, password: `password123`
- **Juan** — username: `juan`, password: `password123`

Each seed user should have a filled-out profile, several posts, and some follows/likes between them.

### General
- No hardcoded secrets — use `.env` files and `config.py`
- All endpoints validate input via Pydantic schemas
- Prefer explicit over implicit
- Keep functions small and testable
