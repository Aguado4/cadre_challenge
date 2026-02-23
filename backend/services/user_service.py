from sqlalchemy import or_, func, select
from sqlalchemy.orm import Session

from core.exceptions import ForbiddenError, UserNotFoundError
from models.user import User
from schemas.user import ProfileResponse, ProfileUpdate, UserSearchResult
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


def search_users(
    db: Session, query: str, current_user_id: int | None = None, limit: int = 20
) -> list[UserSearchResult]:
    q = query.strip()
    if not q:
        return []
    users = db.scalars(
        select(User)
        .where(
            or_(
                func.lower(User.username).contains(q.lower()),
                func.lower(User.display_name).contains(q.lower()),
            )
        )
        .limit(limit)
    ).all()

    if current_user_id:
        from models.follower import Follower
        followed_ids = set(
            db.scalars(
                select(Follower.followed_id).where(
                    Follower.follower_id == current_user_id,
                    Follower.followed_id.in_([u.id for u in users]),
                )
            ).all()
        )
    else:
        followed_ids = set()

    return [
        UserSearchResult(
            id=u.id,
            username=u.username,
            display_name=u.display_name,
            followers_count=u.followers_count,
            is_following=u.id in followed_ids,
        )
        for u in users
        if u.id != current_user_id  # exclude self from results
    ]
