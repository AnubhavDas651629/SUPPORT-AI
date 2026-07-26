from uuid import UUID

from fastapi import Depends, HTTPException, Header, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.db.dependencies import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository
from collections.abc import Callable
from app.models.organization_member import OrganizationMember
from app.repositories.organization_member_repository import OrganizationMemberRepository
from app.exceptions.auth import ForbiddenException

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login"
)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:

    try:
        payload = decode_access_token(token)
        user_id = UUID(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

    repository = UserRepository(db)

    user = await repository.get_by_id(user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user

async def get_current_membership(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    organization_id: UUID = Header(
        alias = "X-Organization-ID"
    ),
) -> OrganizationMember:
    repository = OrganizationMemberRepository(db)

    membership = await repository.get_membership(
        user_id=current_user.id,
        organization_id=organization_id
    )
    if membership is None:
        raise ForbiddenException()

    return membership