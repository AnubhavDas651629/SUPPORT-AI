from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.user_repository import UserRepository
from app.core.security import create_access_token, hash_password, verify_password
from app.core.exception_handlers import UserAlreadyExistsException
from app.schemas.auth import TokenResponse

class AuthService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.user_repository = UserRepository(session)

    async def register(self, *, email:str, password:str, full_name:str):
        existing_user = await self.user_repository.get_by_email(email)
        if existing_user:
            raise UserAlreadyExistsException()

        hashed_password = hash_password(password)

        user = await self.user_repository.create(
            email=email,
            hashed_password=hashed_password,
            full_name=full_name,
        )

        await self.session.commit()

        return user

    async def login(self, *, email:str, password: str):
        user = await self.user_repository.get_by_email(email)

        if not user:
            raise InvalidCredentialException()

        if not verify_password(
            password, 
            user.hashed_password
        ): 
            raise InvalidCredentialException()

        token = create_access_token(
            str(user.id),
        )

        return TokenResponse(
            access_token=token,
        )

