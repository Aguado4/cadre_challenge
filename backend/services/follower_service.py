from sqlalchemy import select
from sqlalchemy.orm import Session

from core.exceptions import ForbiddenError, UserNotFoundError
from models.follower import Follower
from models.user import User
from schemas.follower import FollowResponse


def follow_user(db: Session, current_user: User, username: str) -> FollowResponse:
    target = db.scalar(select(User).where(User.username == username.lower()))
    if target is None:
        raise UserNotFoundError()
    if target.id == current_user.id:
        raise ForbiddenError()

    existing = db.scalar(
        select(Follower).where(
            Follower.follower_id == current_user.id,
            Follower.followed_id == target.id,
        )
    )
    if existing:
        # already following — idempotent
        return FollowResponse(
            following=True,
            followers_count=target.followers_count,
            following_count=current_user.following_count,
        )

    db.add(Follower(follower_id=current_user.id, followed_id=target.id))
    target.followers_count += 1
    current_user.following_count += 1
    db.commit()
    db.refresh(target)
    db.refresh(current_user)
    return FollowResponse(
        following=True,
        followers_count=target.followers_count,
        following_count=current_user.following_count,
    )


def unfollow_user(db: Session, current_user: User, username: str) -> FollowResponse:
    target = db.scalar(select(User).where(User.username == username.lower()))
    if target is None:
        raise UserNotFoundError()
    if target.id == current_user.id:
        raise ForbiddenError()

    existing = db.scalar(
        select(Follower).where(
            Follower.follower_id == current_user.id,
            Follower.followed_id == target.id,
        )
    )
    if existing:
        db.delete(existing)
        target.followers_count = max(0, target.followers_count - 1)
        current_user.following_count = max(0, current_user.following_count - 1)
        db.commit()
        db.refresh(target)
        db.refresh(current_user)

    return FollowResponse(
        following=False,
        followers_count=target.followers_count,
        following_count=current_user.following_count,
    )


def is_following(db: Session, follower_id: int, followed_id: int) -> bool:
    return db.scalar(
        select(Follower).where(
            Follower.follower_id == follower_id,
            Follower.followed_id == followed_id,
        )
    ) is not None
