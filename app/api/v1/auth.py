from time import time
from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis

from app.db.dependencies import get_db
from app.redis.dependencies import get_redis
from app.schemas.auth import (
    TokenResponse,
    RefreshTokenRequest,
    ForgotPasswordRequest,
    VerifyForgotPasswordOTPRequest,
    VerifyOTPResponse,
    ResetPasswordRequest,
    GenericMessageResponse,
)
from app.schemas.user import UserCreate, UserResponse
from app.services.auth_service import AuthService
from app.dependencies.rate_limit import rate_limit_ip


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)

@router.post("/register", response_model=UserResponse, status_code=201)
async def register(
    user: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(session=db)

    created_user = await service.register(
        email=user.email,
        password=user.password,
        full_name=user.full_name,
    )

    return UserResponse.model_validate(created_user)


@router.post("/login", response_model=TokenResponse, dependencies=[Depends(rate_limit_ip(times=5, seconds=60))])
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(session=db)

    return await service.login(
        email=form_data.username,
        password=form_data.password,
    )


@router.post("/forgot-password", response_model=GenericMessageResponse,dependencies=[Depends(rate_limit_ip(times=5, seconds=60))])
async def forgot_password(
    request: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    service = AuthService(session=db, redis=redis)

    return await service.forgot_password(email=request.email)


@router.post("/verify-forgot-password-otp", response_model=VerifyOTPResponse, dependencies=[Depends(rate_limit_ip(times=5, seconds=60))])
async def verify_forgot_password_otp(
    request: VerifyForgotPasswordOTPRequest,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    service = AuthService(session=db, redis=redis)

    return await service.verify_forgot_password_otp(
        email=request.email,
        otp=request.otp,
    )


@router.post("/reset-password", response_model=GenericMessageResponse)
async def reset_password(
    request: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(session=db)

    return await service.reset_password(
        reset_token=request.reset_token,
        new_password=request.new_password,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(session=db)

    return await service.refresh(
        refresh_token=request.refresh_token,
    )



