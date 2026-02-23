from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from core.dependencies import get_current_user
from database import get_db
from models.user import User
from schemas.post import PostCreate, PostResponse, PostUpdate
from services.post_service import (
    create_post,
    delete_post,
    get_feed,
    get_user_posts,
    update_post,
)

router = APIRouter(prefix="/posts", tags=["posts"])


@router.get("/feed", response_model=list[PostResponse])
def feed(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    return get_feed(db, skip=skip, limit=limit)


@router.get("/user/{username}", response_model=list[PostResponse])
def user_posts(
    username: str,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    return get_user_posts(db, username, skip=skip, limit=limit)


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
def create(
    data: PostCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_post(db, current_user, data)


@router.put("/{post_id}", response_model=PostResponse)
def update(
    post_id: int,
    data: PostUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return update_post(db, post_id, current_user, data)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    delete_post(db, post_id, current_user)
