from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.exceptions.auth import (
    UserAlreadyExistsException,
    InvalidCredentialsException,
    PermissionDeniedException,
    UserNotFoundException,
    AlreadyOrganizationMemberException
)
from app.exceptions.organization import (
    OrganizationNotFoundException,
    OrganizationAlreadyExistsException,
    MemberNotFoundException,
    KnowledgeBaseNotFoundException,
    KnowledgeBaseAlreadyExistsException,
)
from app.exceptions.document import (
    DocumentNotFoundException,
    DocumentAlreadyExistsException,
)
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

    @app.exception_handler(PermissionDeniedException)
    async def permission_denied(
        request: Request,
        exc: PermissionDeniedException,
    ):
        return JSONResponse(
            status_code=403,
            content={
                "detail": str(exc),
            }
        ) 

    @app.exception_handler(UserNotFoundException)
    async def user_not_found(
        request: Request,
        exc: UserNotFoundException,
    ):
        return JSONResponse(
            status_code=404,
            content={
                "detail": str(exc),
            }
        ) 

    @app.exception_handler(AlreadyOrganizationMemberException)
    async def already_organization_member(
        request: Request,
        exc: AlreadyOrganizationMemberException,
    ):
        return JSONResponse(
            status_code=409,
            content={
                "detail": str(exc),
            }
        ) 
    
    @app.exception_handler(OrganizationAlreadyExistsException)
    async def organization_already_exists_handler(
        request: Request,
        exc: OrganizationAlreadyExistsException,
    ):
        return JSONResponse(
            status_code=409,
            content={
                "detail": str(exc),
            },
        )

    @app.exception_handler(MemberNotFoundException)
    async def member_not_found_handler(
        request: Request,
        exc: MemberNotFoundException,
    ):
        return JSONResponse(
            status_code=404,
            content={
                "detail": str(exc),
            },
        )

    @app.exception_handler(KnowledgeBaseNotFoundException)
    async def knowledge_base_not_found_handler(
        request: Request,
        exc: KnowledgeBaseNotFoundException,
    ):
        return JSONResponse(
            status_code=404,
            content={
                "detail": str(exc),
            },
        )

    @app.exception_handler(KnowledgeBaseAlreadyExistsException)
    async def knowledge_base_already_exists_handler(
        request: Request,
        exc: KnowledgeBaseAlreadyExistsException,
    ):
        return JSONResponse(
            status_code=409,
            content={
                "detail": str(exc),
            },
        )

    @app.exception_handler(DocumentNotFoundException)
    async def document_not_found_handler(
        request: Request,
        exc: DocumentNotFoundException,
    ):
        return JSONResponse(
            status_code=404,
            content={
                "detail": str(exc),
            },
        )

    @app.exception_handler(DocumentAlreadyExistsException)
    async def document_already_exists_handler(
        request: Request,
        exc: DocumentAlreadyExistsException,
    ):
        return JSONResponse(
            status_code=409,
            content={
                "detail": str(exc),
            },
        )