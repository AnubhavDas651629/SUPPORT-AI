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

    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    emails_from_email: str = "noreply@supportai.com"
    emails_from_name: str = "Support AI Team"

    otp_expiry_seconds: int = 300
    otp_length:int = 6

    #storage settings
    storage_provider: str = "local" #set to s3 in production/local for dev
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"
    s3_bucket_name: str = "support-ai-documents"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    google_client_id: str = ""
    google_client_secret: str = ""

    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_pro_price_id: str = ""
    stripe_enterprise_price_id: str = ""


    # for fernet url safe ket enter  in terminal-> uv run python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    webhook_encryption_key: str = ""



@lru_cache
def get_settings():
    return Settings()

settings = get_settings()