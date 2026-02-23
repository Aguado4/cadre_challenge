from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from core.exceptions import UnauthorizedError
from core.security import decode_access_token
from database import get_db
from models.user import User

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    try:
        user_id = decode_access_token(credentials.credentials)
    except ValueError:
        raise UnauthorizedError()

    user = db.get(User, user_id)
    if user is None:
        raise UnauthorizedError()
    return user
