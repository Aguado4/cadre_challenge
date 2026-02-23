import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Username must be at least 3 characters")
        if len(v) > 50:
            raise ValueError("Username must be at most 50 characters")
        if not re.match(r"^[a-zA-Z0-9_]+$", v):
            raise ValueError("Username can only contain letters, numbers, and underscores")
        return v.lower()

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class UserLogin(BaseModel):
    username: str
    password: str


class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    sex: Optional[str] = None
    birthday: Optional[datetime] = None
    relationship_status: Optional[str] = None

    @field_validator("display_name")
    @classmethod
    def validate_display_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v.strip()) == 0:
            return None
        if v is not None and len(v) > 100:
            raise ValueError("Display name must be at most 100 characters")
        return v

    @field_validator("bio")
    @classmethod
    def validate_bio(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) > 500:
            raise ValueError("Bio must be at most 500 characters")
        return v

    @field_validator("sex")
    @classmethod
    def validate_sex(cls, v: Optional[str]) -> Optional[str]:
        allowed = {"male", "female", "non-binary", "prefer not to say"}
        if v is not None and v.lower() not in allowed:
            raise ValueError(f"Sex must be one of: {', '.join(sorted(allowed))}")
        return v.lower() if v else v

    @field_validator("relationship_status")
    @classmethod
    def validate_relationship_status(cls, v: Optional[str]) -> Optional[str]:
        allowed = {"single", "in a relationship", "engaged", "married", "it's complicated", "prefer not to say"}
        if v is not None and v.lower() not in allowed:
            raise ValueError(f"Relationship status must be one of: {', '.join(sorted(allowed))}")
        return v.lower() if v else v


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    created_at: datetime
    followers_count: int
    following_count: int


class ProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    created_at: datetime
    display_name: Optional[str]
    bio: Optional[str]
    sex: Optional[str]
    birthday: Optional[datetime]
    relationship_status: Optional[str]
    followers_count: int
    following_count: int


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    user_id: int
