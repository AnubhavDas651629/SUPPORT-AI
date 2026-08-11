from app.schemas.user import UserResponse
from app.redis.keys import RedisKeys
from app.redis.client import redis_client
from app.redis.cache_services import RedisCacheService
from uuid import UUID

from fastapi import Depends, HTTPException, Header, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, ExpiredSignatureError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.db.dependencies import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository
from collections.abc import Callable
from app.models.organization_member import OrganizationMember, OrganizationRole
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
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please log in again.",
        )
    except (JWTError, KeyError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

    cache_service = RedisCacheService(redis_client)
    cache_key = RedisKeys.cache_user(str(user_id))

    # checking redis cache
    cached_user = await cache_service.get_json(
        key=cache_key,
        schema_cls=UserResponse
    )
    if cached_user:
        return User(
            id=cached_user.id,
            email= cached_user.email,
            full_name=cached_user.full_name,
            is_active=cached_user.is_active,
            is_verified=cached_user.is_verified
        )

    # Cache miss
    repository = UserRepository(db)
    user = await repository.get_by_id(
        user_id
    )
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    #save user to redis
    await cache_service.set_json(
        key=cache_key,
        value=UserResponse.model_validate(user),
        ttl=3600
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


def require_roles(*allowed_roles: OrganizationRole) -> Callable:
    async def dependency(
        membership: OrganizationMember = Depends(
            get_current_membership
            )
        ) -> OrganizationMember:
        if membership.role not in allowed_roles:
            raise ForbiddenException()
        return membership
    return dependency


require_member = require_roles(
    OrganizationRole.MEMBER,
    OrganizationRole.SUPPORT,
    OrganizationRole.ADMIN,
    OrganizationRole.OWNER
)

require_support = require_roles(
    OrganizationRole.SUPPORT,
    OrganizationRole.ADMIN,
    OrganizationRole.OWNER
)

require_admin = require_roles(
    OrganizationRole.ADMIN,
    OrganizationRole.OWNER,
)

require_owner = require_roles(
    OrganizationRole.OWNER,
)