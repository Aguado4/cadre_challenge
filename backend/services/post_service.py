from sqlalchemy import select, desc
from sqlalchemy.orm import Session, joinedload

from core.exceptions import ForbiddenError, PostNotFoundError
from models.like import Like
from models.post import Post
from models.user import User
from schemas.post import PostAuthor, PostCreate, PostResponse, PostUpdate


def _to_response(post: Post, liked_post_ids: set[int] | None = None) -> PostResponse:
    author = (
        PostAuthor(
            id=post.user.id,
            username=post.user.username,
            display_name=post.user.display_name,
        )
        if post.user
        else None
    )
    return PostResponse(
        id=post.id,
        content=post.content,
        created_at=post.created_at,
        updated_at=post.updated_at,
        likes_count=post.likes_count,
        comments_count=post.comments_count,
        liked_by_me=(post.id in liked_post_ids) if liked_post_ids is not None else False,
        user_id=post.user_id,
        author=author,
    )


def _liked_post_ids(db: Session, user_id: int | None, post_ids: list[int]) -> set[int]:
    if not user_id or not post_ids:
        return set()
    rows = db.scalars(
        select(Like.post_id).where(
            Like.user_id == user_id,
            Like.post_id.in_(post_ids),
        )
    ).all()
    return set(rows)


def _get_post_with_author(db: Session, post_id: int) -> Post:
    post = db.scalar(
        select(Post).options(joinedload(Post.user)).where(Post.id == post_id)
    )
    if post is None:
        raise PostNotFoundError()
    return post


def create_post(db: Session, user: User, data: PostCreate) -> PostResponse:
    post = Post(user_id=user.id, content=data.content)
    db.add(post)
    db.commit()
    db.refresh(post)
    return _to_response(_get_post_with_author(db, post.id))


def get_feed(
    db: Session, current_user_id: int | None = None, skip: int = 0, limit: int = 20
) -> list[PostResponse]:
    posts = db.scalars(
        select(Post)
        .options(joinedload(Post.user))
        .order_by(desc(Post.created_at))
        .offset(skip)
        .limit(limit)
    ).all()
    liked = _liked_post_ids(db, current_user_id, [p.id for p in posts])
    return [_to_response(p, liked) for p in posts]


def get_user_posts(
    db: Session, username: str, current_user_id: int | None = None, skip: int = 0, limit: int = 20
) -> list[PostResponse]:
    posts = db.scalars(
        select(Post)
        .join(Post.user)
        .options(joinedload(Post.user))
        .where(User.username == username.lower())
        .order_by(desc(Post.created_at))
        .offset(skip)
        .limit(limit)
    ).all()
    liked = _liked_post_ids(db, current_user_id, [p.id for p in posts])
    return [_to_response(p, liked) for p in posts]


def update_post(db: Session, post_id: int, current_user: User, data: PostUpdate) -> PostResponse:
    post = _get_post_with_author(db, post_id)
    if post.user_id != current_user.id:
        raise ForbiddenError()
    post.content = data.content
    db.commit()
    db.refresh(post)
    return _to_response(_get_post_with_author(db, post.id))


def delete_post(db: Session, post_id: int, current_user: User) -> None:
    post = db.get(Post, post_id)
    if post is None:
        raise PostNotFoundError()
    if post.user_id != current_user.id:
        raise ForbiddenError()
    db.delete(post)
    db.commit()
