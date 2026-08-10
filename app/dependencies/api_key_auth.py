from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.dependencies import get_db
from app.models.organization import Organization
from app.repositories.api_key_repository import ApiKeyRepository
from app.utils.api_key import hash_api_key
from datetime import datetime, UTC

async def get_api_key_organization(
    x_api_key: str = Header(alias="X-API-key"),
    session: AsyncSession = Depends(get_db)
) -> Organization:

    """
    FastAPI dependency for routes that accept API Key authentication.
    1. Reads the 'X-API-Key' header from the request
    2. Hashes it with SHA-256
    3. Looks it up in the DB
    4. Updates last_used_at
    5. Returns the Organization the key belongs to
    """

    key_hash = hash_api_key(x_api_key)

    repo = ApiKeyRepository(session)
    api_key = await repo.get_by_hash(key_hash=key_hash)

    if api_key is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked API key"
        )

    #check if key has expired
    if api_key.expires_at and api_key.expires_at < datetime.now(UTC):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key has expired"
        )


    # Update last_used_at asynchronously (fire and forget approach)
    await repo.touch_last_used(api_key=api_key)
    await session.commit()

    # Load and return the full Organization so the route knows which org this key belongs to
    await session.refresh(api_key, attribute_names=["organization"])
    return api_key.organization
    
