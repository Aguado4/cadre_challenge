from sqlalchemy import select
from sqlalchemy.orm import Session

from models.like import Like
from models.post import Post
from schemas.like import LikeResponse


def toggle_like(db: Session, user_id: int, post_id: int) -> LikeResponse:
    """Atomically like or unlike a post, keeping likes_count in sync."""
    post = db.get(Post, post_id)
    if post is None:
        from core.exceptions import PostNotFoundError
        raise PostNotFoundError()

    existing = db.scalar(
        select(Like).where(Like.user_id == user_id, Like.post_id == post_id)
    )

    if existing:
        # Unlike — remove the row and decrement count atomically
        db.delete(existing)
        post.likes_count = max(0, post.likes_count - 1)
        liked = False
    else:
        # Like — add the row and increment count atomically
        db.add(Like(user_id=user_id, post_id=post_id))
        post.likes_count += 1
        liked = True

    db.commit()
    return LikeResponse(post_id=post_id, likes_count=post.likes_count, liked_by_me=liked)
