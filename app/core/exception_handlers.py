from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.exceptions.auth import UserAlreadyExistsException

def register_exception_handlers(app: FastAPI):

    @app.exception_handler(UserAlreadyExistsException)
    async def user_exists_handler(
        request: Request,
        exc: UserAlreadyExistsException,
    ):
        return JSONResponse(
            status_code=409,
            content={
                "detail": str(exc),
            },
        )