from pwdlib import PasswordHash
from datetime import UTC, datetime, timedelta
from jose import JWTError, jwt

from app.core.config import settings

import secrets
import hashlib

password_hash = PasswordHash.recommended()

def generate_refresh_token() -> str:
    return secrets.token_urlsafe(64)

def hash_refresh_token(token:str) -> str:
    return hashlib.sha256(
        token.encode()
    ).hexdigest()

def hash_password(password:str) -> str :
    return password_hash.hash(password)

def verify_password(password: str, hashed_password:str) -> bool:
    return password_hash.verify(password, hashed_password)

def create_access_token(user_id:str) -> str:
    expire = datetime.now(UTC) + timedelta(
        minutes=settings.access_token_expire_minutes
    )

    payload = {
        "sub": str(user_id),
        "exp": expire,
        "type": "access",
    }

    return jwt.encode(
        payload,
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,

    )

def decode_access_token(token: str) -> dict:
    return jwt.decode(
        token,
        settings.jwt_secret,
        algorithms=[settings.jwt_algorithm],
    )


def create_reset_token(user_id: str) -> str:
    expire = datetime.now(UTC) + timedelta(minutes=10)
    payload = {
        "sub": str(user_id),
        "exp": expire,
        "type": "password_reset",
    }
    return jwt.encode(
        payload,
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )


def decode_reset_token(token: str) -> dict:
    payload = jwt.decode(
        token,
        settings.jwt_secret,
        algorithms=[settings.jwt_algorithm],
    )
    if payload.get("type") != "password_reset":
        raise JWTError("Invalid token type")
    return payload

