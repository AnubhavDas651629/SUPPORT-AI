from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    # Application
    app_name:str
    debug: bool

    #Database
    database_url: str

    #security
    jwt_secret: str
    jwt_algorithm: str
    access_token_expire_minutes: int
    refresh_token_expire_days: int

    openai_api_key: str

    rabbitmq_url: str

    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_db: int = 0

    otp_expiry_seconds: int = 300
    otp_length:int = 6

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


@lru_cache
def get_settings():
    return Settings()

settings = get_settings()