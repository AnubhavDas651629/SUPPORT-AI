from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user_session import UserSession

class UserSessionRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, *, user_id: str, refresh_token_hash: str, expires_at) -> UserSession:
        session = UserSession(
            user_id=user_id,
            refresh_token_hash=refresh_token_hash,
            expires_at=expires_at,
        )
        self.session.add(session)
        return session

    async def get_by_refresh_token_hash():
        pass
    
    
    
    async def delete():
        pass
