import re
from redis.asyncio import Redis

from app.core.config import settings
from app.redis.keys import RedisKeys
from app.services.base import BaseService
from app.utils.otp import generate_otp

class OTPService(BaseService):
    def __init__(self, redis: Redis):
        self.redis = redis

        async def generate_email_otp(self, email:str) -> str:
            """
            Generate an OTP, store it in reids and return it
            """

            otp = generate_otp(settings.otp_length)

            await self.redis.set(
                RedisKeys.email_otp(email),
                otp,
                ex=settings.otp_expiry_seconds
            )

            return otp
        async def verify_email_otp(self,*, email:str, otp:str) -> bool:
            stored_otp = await self.redis.get(
                RedisKeys.email_otp(email)
            )
            if stored_otp is None:
                return False

            if stored_otp != otp:
                return False

            await self.redis.delete(
                RedisKeys.email_otp(email)
            )

            return True


        async def delete_email_otp(self, *, email:str) -> None:
            await self.redis.delete(
                RedisKeys.email_otp(email)
            )
