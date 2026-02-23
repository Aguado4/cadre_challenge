# plan.md — CadreBook Development Plan

## Overview

**CadreBook** — a minimal social network with auth, profiles, posts, feed, likes, comments, and follows.
Architecture: FastAPI (backend) + React/Vite (frontend) + SQLite/SQLAlchemy (db).
Design: Black & white with `#db4545` red accents.

**Workflow per phase:**
1. Implement phase
2. Present summary table of changed/created files
3. Provide test steps for user approval
4. After approval → `git add`, `git commit`, `git push`
5. Begin next phase

---

## Phase 0 — Foundation (current)
**Goal:** Create project documentation and memory structure.

- [ ] `CLAUDE.md` — Project description, tech stack, file structure, coding standards
- [ ] `plan.md` — This file
- [ ] `memory/` — Sub-agent memory folder with `MEMORY.md`

---

## Phase 1 — Project Scaffolding ("Hello World")
**Goal:** Working backend + frontend with health check endpoint. Proves the stack runs end-to-end.

### Backend
- `backend/main.py` — FastAPI app with `/health` endpoint
- `backend/database.py` — SQLAlchemy engine setup (SQLite)
- `backend/config.py` — Pydantic BaseSettings loading `.env`
- `backend/requirements.txt`
- `backend/.env.example`

### Frontend
- Vite + React scaffold
- `src/App.jsx` — Renders "CadreBook" + health check status
- Tailwind configured with custom colors (`cadre-red: #db4545`, dark backgrounds)
- Proxy config pointing `/api` → `localhost:8000`

**Test:** `GET /health` returns `{"status": "ok"}`. Frontend shows the CadreBook name and health status.

---

## Phase 1.5 — Seed Data
**Goal:** Populate the DB with test users for development.

- `backend/seed.py` — Script that creates users: Eliana, Chad, Dhruv, Juan (all with `password123`)
- Each user gets a profile, posts, and some likes/follows between them
- Run after DB migrations: `python seed.py`

---

## Phase 2 — Authentication
**Goal:** User registration and login with JWT. Protected routes work.

### Backend
- `models/user.py` — User ORM model (id, username, email, hashed_password, created_at, likes_count, followers_count, following_count)
- `schemas/user.py` — UserCreate, UserLogin, UserResponse, Token schemas
- `core/security.py` — hash_password, verify_password, create_access_token, decode_token
- `core/dependencies.py` — get_db, get_current_user
- `core/exceptions.py` — Custom exceptions + FastAPI handlers
- `services/auth_service.py` — register, login business logic
- `routers/auth.py` — POST /auth/register, POST /auth/login

### Frontend
- `context/AuthContext.jsx` — Token state, login/logout
- `pages/LoginPage.jsx`
- `pages/RegisterPage.jsx`
- `components/ProtectedRoute.jsx`
- `api/auth.js`

**Test:** Register user, login, receive JWT, access protected route, wrong password → 401.

---

## Phase 3 — User Profiles
**Goal:** View and edit own profile. Profile fields: name, member_since, sex, birthday, relationship_status, bio.

### Backend
- Update `models/user.py` with profile fields
- `schemas/user.py` — ProfileUpdate, ProfileResponse
- `services/user_service.py` — get_profile, update_profile
- `routers/users.py` — GET /users/{username}, PUT /users/me

### Frontend
- `pages/ProfilePage.jsx` — Display profile, edit form for own profile
- `api/users.js`

**Test:** View profile, edit bio, save changes persist.

---

## Phase 4 — Posts
**Goal:** Create, view, edit, delete text posts. Feed shows all posts chronologically.

### Backend
- `models/post.py` — Post (id, user_id, content, created_at, updated_at, likes_count)
- `schemas/post.py` — PostCreate, PostUpdate, PostResponse
- `services/post_service.py` — create, get_feed, get_user_posts, update, delete
- `routers/posts.py` — CRUD endpoints

### Frontend
- `pages/FeedPage.jsx` — Feed with create post form
- `components/PostCard.jsx` — Shows author, timestamp, content, edit/delete if owner
- `api/posts.js`

**Test:** Create post, appears in feed with author + time, edit/delete own post, cannot edit others'.

---

## Phase 5 — Likes
**Goal:** Like/unlike posts in real time. Denormalized count on Post model.

### Backend
- `models/like.py` — Like (id, user_id, post_id) with unique constraint
- `schemas/like.py` — LikeResponse
- `services/like_service.py` — toggle_like (atomic: like + increment / unlike + decrement)
- `routers/likes.py` — POST /posts/{post_id}/like, DELETE /posts/{post_id}/like

### Frontend
- Like button in `PostCard.jsx` with optimistic update + rollback on error
- `api/likes.js`

**Test:** Like post → count increments. Unlike → decrements. Double-like prevented. Count consistent in DB.

---

## Phase 6 — Comments
**Goal:** Add and view comments on posts.

### Backend
- `models/comment.py` — Comment (id, user_id, post_id, content, created_at)
- `schemas/comment.py` — CommentCreate, CommentResponse
- `services/comment_service.py` — add_comment, get_comments, delete_comment
- `routers/comments.py` — GET/POST /posts/{post_id}/comments, DELETE /comments/{id}

### Frontend
- `components/CommentSection.jsx` — Comment list + input
- Expandable in `PostCard.jsx`
- `api/comments.js`

**Test:** Add comment, appears below post, delete own comment, cannot delete others'.

---

## Phase 7 — Follow System
**Goal:** Follow/unfollow users. Feed shows posts from followed users.

### Backend
- `models/follower.py` — Follower (follower_id, followed_id) with unique constraint
- Denormalized `followers_count` and `following_count` on User model (atomic updates)
- `services/follower_service.py` — follow, unfollow, get_followers, get_following
- `routers/followers.py` — POST/DELETE /users/{username}/follow

### Frontend
- Follow/unfollow button on profile pages
- Feed toggle: "All posts" vs "Following only"

**Test:** Follow user, their posts appear in filtered feed. Counts accurate. Unfollow removes them.

---

## Future Phases (TBD)
- Phase 8: Image uploads for posts/avatars
- Phase 9: Notifications
- Phase 10: Search users/posts
- Phase 11: Deployment (Railway/Render + Vercel)
