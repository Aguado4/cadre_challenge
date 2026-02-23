from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


class CommentCreate(BaseModel):
    content: str

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        v = v.strip()
        if len(v) == 0:
            raise ValueError("Comment cannot be empty")
        if len(v) > 500:
            raise ValueError("Comment must be at most 500 characters")
        return v


class CommentAuthor(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    display_name: str | None


class CommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    post_id: int
    user_id: int
    content: str
    created_at: datetime
    author: CommentAuthor | None = None
