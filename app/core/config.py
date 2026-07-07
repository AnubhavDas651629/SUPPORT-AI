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

    openai_api_key: str

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

@lru_cache
def get_settings():
    return Settings()

settings = get_settings()