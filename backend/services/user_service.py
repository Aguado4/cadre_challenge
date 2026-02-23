from sqlalchemy import select
from sqlalchemy.orm import Session

from core.exceptions import ForbiddenError, UserNotFoundError
from models.user import User
from schemas.user import ProfileResponse, ProfileUpdate
from services.follower_service import is_following


def get_profile(db: Session, username: str, current_user_id: int | None = None) -> ProfileResponse:
    user = db.scalar(select(User).where(User.username == username.lower()))
    if user is None:
        raise UserNotFoundError()
    return ProfileResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        created_at=user.created_at,
        display_name=user.display_name,
        bio=user.bio,
        sex=user.sex,
        birthday=user.birthday,
        relationship_status=user.relationship_status,
        followers_count=user.followers_count,
        following_count=user.following_count,
        is_following=is_following(db, current_user_id, user.id) if current_user_id else False,
    )


def update_profile(db: Session, current_user: User, data: ProfileUpdate) -> User:
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user
