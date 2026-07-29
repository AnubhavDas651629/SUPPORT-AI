from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.dependencies import get_db
from app.redis.dependencies import get_redis
from app.schemas.auth import TokenResponse
from redis.asyncio import Redis
from app.schemas.user import UserCreate, UserResponse
from app.services.auth_service import AuthService
from app.schemas.auth import RefreshTokenRequest, LoginResponse, LoginRequest, VerifyOTPRequest


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)

@router.post("/register", response_model=UserResponse, status_code=201 )
async def register(
    user: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)

    created_user = await service.register(
        email = user.email,
        password=user.password,
        full_name=user.full_name,
    )

    return UserResponse.model_validate(created_user)

from app.schemas.auth import LoginRequest, LoginResponse

@router.post(
    "/login",
    response_model=LoginResponse,
)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    service = AuthService(
        session=db,
        redis=redis,
    )

    return await service.login(
        email=request.email,
        password=request.password,
    )

@router.post(
    "/login/verify-otp",
    response_model=TokenResponse,
)
async def verify_login_otp(
    request: VerifyOTPRequest,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    service = AuthService(
        session=db,
        redis=redis,
    )

    return await service.verify_login_otp(
        email=request.email,
        otp=request.otp,
    )

@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    service = AuthService(db)

    return await service.refresh(
        refresh_token=request.refresh_token
    )

