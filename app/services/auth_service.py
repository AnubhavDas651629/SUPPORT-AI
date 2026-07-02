from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user_repository import UserRepository
from app.core.security import hash_password

class AuthService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.user_repository = UserRepository(session)

    async def register(self, *, email:str, password:str, full_name:str):
        existing_user = await self.user_repository.get_by_email(email)
        if existing_user:
            raise ValueError("User with this email already exists")

        hashed_password = hash_password(password)

        user = await self.user_repository.create(
            email=email,
            hashed_password=hashed_password,
            full_name=full_name,
        )

        await self.session.commit()

        return user


