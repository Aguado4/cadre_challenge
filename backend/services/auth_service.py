from sqlalchemy import select
from sqlalchemy.orm import Session

from core.exceptions import (
    EmailAlreadyExistsError,
    InvalidCredentialsError,
    UsernameAlreadyExistsError,
)
from core.security import create_access_token, hash_password, verify_password
from models.user import User
from schemas.user import AuthResponse, UserCreate, UserResponse


def register_user(db: Session, data: UserCreate) -> AuthResponse:
    if db.scalar(select(User).where(User.username == data.username)):
        raise UsernameAlreadyExistsError()
    if db.scalar(select(User).where(User.email == data.email)):
        raise EmailAlreadyExistsError()

    user = User(
        username=data.username,
        email=data.email,
        hashed_password=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return AuthResponse(access_token=token, user=UserResponse.model_validate(user))


def login_user(db: Session, username: str, password: str) -> AuthResponse:
    user = db.scalar(select(User).where(User.username == username.lower().strip()))
    if user is None or not verify_password(password, user.hashed_password):
        raise InvalidCredentialsError()

    token = create_access_token(user.id)
    return AuthResponse(access_token=token, user=UserResponse.model_validate(user))
