from pydantic import BaseModel


class LikeResponse(BaseModel):
    post_id: int
    likes_count: int
    liked_by_me: bool
