from sqlalchemy import select, desc
from sqlalchemy.orm import Session, joinedload

from core.exceptions import ForbiddenError, PostNotFoundError
from models.post import Post
from models.user import User
from schemas.post import PostCreate, PostResponse, PostAuthor, PostUpdate


def _to_response(post: Post) -> PostResponse:
    author = PostAuthor(
        id=post.user.id,
        username=post.user.username,
        display_name=post.user.display_name,
    ) if post.user else None
    return PostResponse(
        id=post.id,
        content=post.content,
        created_at=post.created_at,
        updated_at=post.updated_at,
        likes_count=post.likes_count,
        user_id=post.user_id,
        author=author,
    )


def _get_post_with_author(db: Session, post_id: int) -> Post:
    post = db.scalar(
        select(Post)
        .options(joinedload(Post.user))
        .where(Post.id == post_id)
    )
    if post is None:
        raise PostNotFoundError()
    return post


def create_post(db: Session, user: User, data: PostCreate) -> PostResponse:
    post = Post(user_id=user.id, content=data.content)
    db.add(post)
    db.commit()
    db.refresh(post)
    # Reload with author join
    return _to_response(_get_post_with_author(db, post.id))


def get_feed(db: Session, skip: int = 0, limit: int = 20) -> list[PostResponse]:
    posts = db.scalars(
        select(Post)
        .options(joinedload(Post.user))
        .order_by(desc(Post.created_at))
        .offset(skip)
        .limit(limit)
    ).all()
    return [_to_response(p) for p in posts]


def get_user_posts(db: Session, username: str, skip: int = 0, limit: int = 20) -> list[PostResponse]:
    posts = db.scalars(
        select(Post)
        .join(Post.user)
        .options(joinedload(Post.user))
        .where(User.username == username.lower())
        .order_by(desc(Post.created_at))
        .offset(skip)
        .limit(limit)
    ).all()
    return [_to_response(p) for p in posts]


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
