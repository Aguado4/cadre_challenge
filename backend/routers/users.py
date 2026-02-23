from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.dependencies import get_current_user, get_optional_current_user
from database import get_db
from models.user import User
from schemas.user import ProfileResponse, ProfileUpdate
from services.user_service import get_profile, update_profile

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/{username}", response_model=ProfileResponse)
def get_user_profile(
    username: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    return get_profile(db, username, current_user_id=current_user.id if current_user else None)


@router.put("/me/profile", response_model=ProfileResponse)
def update_my_profile(
    data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return update_profile(db, current_user, data)
