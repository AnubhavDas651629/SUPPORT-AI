from sqlalchemy.ext.asyncio import AsyncSession
from datetime import UTC, datetime, timedelta

from app.core.config import settings
from app.core.security import (
    create_access_token,
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.db import session
from app.exceptions.auth import InvalidCredentialsException, UserAlreadyExistsException
from app.repositories.user_repository import UserRepository
from app.repositories.user_session_repository import UserSessionRepository
from app.schemas.auth import TokenResponse, LoginResponse
from redis.asyncio import Redis
from app.services.otp_services import OTPService


class AuthService:
    def __init__(self, session: AsyncSession, redis: Redis):
        self.session = session
        self.redis = redis
        self.user_repository = UserRepository(session)
        self.user_session_repository = UserSessionRepository(session)
        self.otp_service = OTPService(redis)

    async def register(self, *, email: str, password: str, full_name: str):
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



    async def _create_user_session(self, *, user_id:str) -> str:
        refresh_token = generate_refresh_token()

        refresh_token_hash = hash_refresh_token(
            refresh_token
        )

        expires_at = datetime.now(UTC) + timedelta(
            days=settings.refresh_token_expire_days
        )

        await self.user_session_repository.create(
            user_id=user_id,
            refresh_token_hash=refresh_token_hash,
            expires_at=expires_at,
        )

        return refresh_token



    async def login(self, *, email: str, password: str):
        user = await self.user_repository.get_by_email(email)

        if not user:
            raise InvalidCredentialsException()

        if not verify_password(password, user.hashed_password):
            raise InvalidCredentialsException()

        otp = await self.otp_service.generate_email_otp(
        email=email,
    )

        # TODO:
        # Queue email using EmailService
        print(f"OTP for {email}: {otp}")

        return LoginResponse(
            message="OTP sent successfully"
        )

    async def verify_login_otp(self, *, email: str, otp:str) -> TokenResponse:
        user = await self.user_repository.get_by_email(email)
        if not user:
            raise InvalidCredentialsException()

        verified = await self.otp_service.verify_email_otp(
            email=email,
            otp=otp
        )
    
        if not verified:
            raise InvalidCredentialsException()

        refresh_token = await self._create_user_session(
            user_id=user.id
        )

        await self.session.commit()
        access_token = create_access_token(
            str(user.id)
        )
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token
        )


    #not using helper function in this 
    async def refresh(self, *, refresh_token: str) -> TokenResponse:
        # hash incoming token
        refresh_token_hash = hash_refresh_token(
            refresh_token
        )

        # find session
        user_session = await self.user_session_repository.get_by_refresh_token_hash(
            refresh_token_hash
        )
        if not user_session:
            raise InvalidCredentialsException()

        #check expiry
        if user_session.expires_at < datetime.now(UTC):
            await self.user_session_repository.delete(
                user_session
            )
            await self.session.commit()
            raise InvalidCredentialsException()

        #generate new token
        new_refresh_token = generate_refresh_token()

        new_refresh_token_hash = hash_refresh_token(
            new_refresh_token
        )

        #delete old session
        await self.user_session_repository.delete(
            user_session
        )

        #create new sesssion
        expires_at = datetime.now(UTC) + timedelta(
            days=settings.refresh_token_expire_days
        )

        await self.user_session_repository.create(
            user_id=user_session.user_id,
            refresh_token_hash= new_refresh_token_hash,
            expires_at=expires_at,
        )

        await self.session.commit()

        #create access token
        access_token = create_access_token(
            str(user_session.user_id)
        )

        #return tokens
        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token
        )



