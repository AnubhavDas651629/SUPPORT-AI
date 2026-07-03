from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.dependencies import get_db
from app.schemas.auth import TokenResponse
from app.schemas.user import UserCreate, UserResponse
from app.services.auth_service import AuthService


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

@router.post(
    "/login",
    response_model=TokenResponse,
)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)

    return await service.login(
        email=form_data.username,      # username contains the email
        password=form_data.password,
    )

    

