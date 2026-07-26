from unittest import result
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user_session import UserSession
from sqlalchemy import select

class UserSessionRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, *, user_id: str, refresh_token_hash: str, expires_at) -> UserSession:
        user_session = UserSession(
            user_id=user_id,
            refresh_token_hash=refresh_token_hash,
            expires_at=expires_at,
        )
        self.session.add(user_session)
        return user_session

    async def get_by_refresh_token_hash(self, refresh_token_hash: str) -> UserSession | None:
        stmt = (
            select(UserSession)
            .where(
                UserSession.refresh_token_hash == refresh_token_hash
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
        
    async def delete(self, user_session: UserSession) -> None:
        await self.session.delete(user_session)
