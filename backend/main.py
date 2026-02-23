from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings  # noqa: F401 — ensures settings load on startup
from core.exceptions import register_exception_handlers
from database import Base, engine
import models  # noqa: F401 — registers all ORM models before create_all
from routers.auth import router as auth_router
from routers.users import router as users_router
from routers.posts import router as posts_router

app = FastAPI(title="CadreBook API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(posts_router)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health_check():
    return {"status": "ok", "app": "CadreBook"}
