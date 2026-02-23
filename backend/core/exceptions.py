from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class AppError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class UserNotFoundError(AppError):
    def __init__(self):
        super().__init__("User not found", status_code=404)


class UsernameAlreadyExistsError(AppError):
    def __init__(self):
        super().__init__("That username is already taken", status_code=409)


class EmailAlreadyExistsError(AppError):
    def __init__(self):
        super().__init__("An account with this email already exists", status_code=409)


class InvalidCredentialsError(AppError):
    def __init__(self):
        super().__init__("Incorrect username or password", status_code=401)


class UnauthorizedError(AppError):
    def __init__(self):
        super().__init__("Authentication required. Please log in.", status_code=401)


class ForbiddenError(AppError):
    def __init__(self):
        super().__init__("You don't have permission to perform this action", status_code=403)


class PostNotFoundError(AppError):
    def __init__(self):
        super().__init__("Post not found", status_code=404)


class CommentNotFoundError(AppError):
    def __init__(self):
        super().__init__("Comment not found", status_code=404)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message},
        )
