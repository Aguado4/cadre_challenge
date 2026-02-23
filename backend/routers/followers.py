from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.dependencies import get_current_user, get_db
from models.user import User
from schemas.follower import FollowResponse
from services.follower_service import follow_user, unfollow_user

router = APIRouter(prefix="/users", tags=["followers"])


@router.post("/{username}/follow", response_model=FollowResponse)
def follow(
    username: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return follow_user(db, current_user, username)


@router.delete("/{username}/follow", response_model=FollowResponse)
def unfollow(
    username: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return unfollow_user(db, current_user, username)
