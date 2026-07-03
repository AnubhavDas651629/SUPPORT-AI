from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.exceptions.auth import UserAlreadyExistsException, InvalidCredentialsException
from app.exceptions.organization import OrganizationNotFoundException
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
    @app.exception_handler(InvalidCredentialsException)
    async def invalid_credentials_handler(
        request: Request,
        exc: InvalidCredentialsException,
    ):
        return JSONResponse(
            status_code=401,
            content={"detail": str(exc)},
        )

    @app.exception_handler(OrganizationNotFoundException)
    async def organization_not_found_handler(
        request: Request,
        exc: OrganizationNotFoundException,
    ):
        return JSONResponse(
            status_code=404,
            content={
                "detail": str(exc),
            }
        )