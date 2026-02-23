from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


class PostCreate(BaseModel):
    content: str

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        v = v.strip()
        if len(v) == 0:
            raise ValueError("Post content cannot be empty")
        if len(v) > 1000:
            raise ValueError("Post content must be at most 1000 characters")
        return v


class PostUpdate(BaseModel):
    content: str

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        v = v.strip()
        if len(v) == 0:
            raise ValueError("Post content cannot be empty")
        if len(v) > 1000:
            raise ValueError("Post content must be at most 1000 characters")
        return v


class PostAuthor(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    display_name: str | None


class PostResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    content: str
    created_at: datetime
    updated_at: datetime
    likes_count: int
    user_id: int
    author: PostAuthor | None = None
