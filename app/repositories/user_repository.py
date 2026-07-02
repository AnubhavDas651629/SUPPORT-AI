from uuid import UUID
from sqlalchemy import select, String

from app.db import session
from app.models.user import User
from app.repositories.base import BaseRepository

class UserRepository(BaseRepository):
    async def get_by_id(self, user_id: UUID) -> User | None:
        query = select(User).where(User.id == user_id)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        query = select(User).where(User.email == email)
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
        
    async def create(self, *, email: str, hashed_password:str, full_name:str) -> User:
        user = User(
            email=email,
            hashed_password=hashed_password,
            full_name=full_name,
        )
        self.session.add(user)
        await self.session.flush()

        return user