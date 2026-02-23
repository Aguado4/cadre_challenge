"""
Seed script — populates the database with test users and posts.

Usage (from backend/ with venv activated):
    python seed.py

Safe to re-run: skips users that already exist, skips their posts too.
Users: eliana, chad, dhruv, juan  (all password: password123)
"""

import sys
from datetime import datetime, timezone

import bcrypt
from sqlalchemy import select

from database import SessionLocal, engine, Base
import models  # noqa: F401 — registers all ORM models

from models.user import User
from models.post import Post


def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


USERS = [
    {
        "username": "eliana",
        "email": "eliana@cadrebook.dev",
        "display_name": "Eliana Perez",
        "bio": "Coffee addict. Building things on the internet. She/her.",
        "sex": "female",
        "birthday": datetime(1995, 3, 14, tzinfo=timezone.utc),
        "relationship_status": "in a relationship",
    },
    {
        "username": "chad",
        "email": "chad@cadrebook.dev",
        "display_name": "Chad Lohrli",
        "bio": "Gym. Code. Repeat. Probably talking about startups.",
        "sex": "male",
        "birthday": datetime(1993, 7, 4, tzinfo=timezone.utc),
        "relationship_status": "single",
    },
    {
        "username": "dhruv",
        "email": "dhruv@cadrebook.dev",
        "display_name": "Dhruv Kanetkar",
        "bio": "ML engineer by day, chess player by night. Bengaluru → NYC.",
        "sex": "male",
        "birthday": datetime(1997, 11, 22, tzinfo=timezone.utc),
        "relationship_status": "prefer not to say",
    },
    {
        "username": "juan",
        "email": "juan@cadrebook.dev",
        "display_name": "Juan Aguado",
        "bio": "Building CadreBook. Full-stack dev. Always shipping.",
        "sex": "male",
        "birthday": datetime(1996, 5, 9, tzinfo=timezone.utc),
        "relationship_status": "single",
    },
]

POSTS = {
    "eliana": [
        "Just deployed my first FastAPI app to production. The feeling never gets old ☕",
        "Hot take: dark mode isn't just a preference — it's a lifestyle.",
        "Three hours debugging a timezone issue. Turns out the server was storing UTC but the client thought it was local time. Always append that Z!",
        "What's everyone reading this month? I just started 'The Pragmatic Programmer' again.",
    ],
    "chad": [
        "PRs don't merge themselves, people.",
        "Nothing beats a clean git log. Commit messages should be poetry.",
        "Five sets of deadlifts and then refactored the entire auth service. Productive Saturday.",
        "Reminder: premature optimization is the root of all evil. Write it clean first.",
        "Just hit 100 commits on my side project. Small wins.",
    ],
    "dhruv": [
        "Spent the morning fine-tuning a transformer model. Spent the afternoon losing at chess. Balance.",
        "The best code is the code you don't have to write.",
        "Denormalizing your like counts is not cheating — it's called engineering tradeoffs.",
        "If your DB query takes more than 100ms, that's a conversation starter.",
        "New city, new coffee shop, same laptop. Hello NYC!",
    ],
    "juan": [
        "CadreBook is live! Phase 4 done — posts, feed, edit and delete. Next up: likes.",
        "Building in public is underrated. Ship fast, iterate faster.",
        "SQLite for dev, Postgres for prod. Never forget to delete your .db file when you change the schema 😅",
        "Sub-agents are genuinely useful for parallelizing frontend and backend work.",
        "The hardest part of any project is keeping the scope small enough to actually finish it.",
    ],
}


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        created_users = 0
        created_posts = 0

        for data in USERS:
            existing = db.scalar(select(User).where(User.username == data["username"]))
            if existing:
                print(f"  skip  user '{data['username']}' (already exists)")
                continue

            user = User(
                username=data["username"],
                email=data["email"],
                hashed_password=hash_pw("password123"),
                display_name=data["display_name"],
                bio=data["bio"],
                sex=data["sex"],
                birthday=data["birthday"],
                relationship_status=data["relationship_status"],
            )
            db.add(user)
            db.flush()  # get user.id without committing yet

            for content in POSTS.get(data["username"], []):
                db.add(Post(user_id=user.id, content=content))
                created_posts += 1

            created_users += 1
            print(f"  added user '{data['username']}' with {len(POSTS.get(data['username'], []))} posts")

        db.commit()
        print(f"\nDone — {created_users} users and {created_posts} posts seeded.")

    except Exception as e:
        db.rollback()
        print(f"\nSeed failed: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    print("Seeding database...")
    seed()
