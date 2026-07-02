from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user_repository import UserRepository

class AuthService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.user_repository = UserRepository(session)

    async def register(self, *, email:str, password:str, full_name:str):
        existing_user = await self.user_repository.get_by_email(email)