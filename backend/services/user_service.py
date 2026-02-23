from sqlalchemy import select
from sqlalchemy.orm import Session

from core.exceptions import ForbiddenError, UserNotFoundError
from models.user import User
from schemas.user import ProfileUpdate


def get_profile(db: Session, username: str) -> User:
    user = db.scalar(select(User).where(User.username == username.lower()))
    if user is None:
        raise UserNotFoundError()
    return user


def update_profile(db: Session, current_user: User, data: ProfileUpdate) -> User:
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user
