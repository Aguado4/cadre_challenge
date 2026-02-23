from sqlalchemy import select, asc
from sqlalchemy.orm import Session, joinedload

from core.exceptions import CommentNotFoundError, ForbiddenError, PostNotFoundError
from models.comment import Comment
from models.post import Post
from models.user import User
from schemas.comment import CommentAuthor, CommentCreate, CommentResponse


def _to_response(comment: Comment) -> CommentResponse:
    author = (
        CommentAuthor(
            id=comment.user.id,
            username=comment.user.username,
            display_name=comment.user.display_name,
        )
        if comment.user
        else None
    )
    return CommentResponse(
        id=comment.id,
        post_id=comment.post_id,
        user_id=comment.user_id,
        content=comment.content,
        created_at=comment.created_at,
        author=author,
    )


def get_comments(db: Session, post_id: int) -> list[CommentResponse]:
    post = db.get(Post, post_id)
    if post is None:
        raise PostNotFoundError()

    comments = db.scalars(
        select(Comment)
        .options(joinedload(Comment.user))
        .where(Comment.post_id == post_id)
        .order_by(asc(Comment.created_at))
    ).all()
    return [_to_response(c) for c in comments]


def add_comment(db: Session, post_id: int, user: User, data: CommentCreate) -> CommentResponse:
    post = db.get(Post, post_id)
    if post is None:
        raise PostNotFoundError()

    comment = Comment(user_id=user.id, post_id=post_id, content=data.content)
    db.add(comment)
    post.comments_count += 1
    db.commit()
    db.refresh(comment)

    # Reload with author join
    comment = db.scalar(
        select(Comment)
        .options(joinedload(Comment.user))
        .where(Comment.id == comment.id)
    )
    return _to_response(comment)


def delete_comment(db: Session, comment_id: int, current_user: User) -> None:
    comment = db.get(Comment, comment_id)
    if comment is None:
        raise CommentNotFoundError()
    if comment.user_id != current_user.id:
        raise ForbiddenError()
    post = db.get(Post, comment.post_id)
    db.delete(comment)
    if post:
        post.comments_count = max(0, post.comments_count - 1)
    db.commit()
