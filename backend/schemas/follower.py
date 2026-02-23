from pydantic import BaseModel


class FollowResponse(BaseModel):
    following: bool
    followers_count: int
    following_count: int
