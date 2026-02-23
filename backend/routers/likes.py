from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.dependencies import get_current_user
from database import get_db
from models.user import User
from schemas.like import LikeResponse
from services.like_service import toggle_like

router = APIRouter(prefix="/posts", tags=["likes"])


@router.post("/{post_id}/like", response_model=LikeResponse)
def like_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return toggle_like(db, current_user.id, post_id)
