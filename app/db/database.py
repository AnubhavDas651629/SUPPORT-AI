# Create SQLALchemy engine -> to connect to Postgres SQL
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings

engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_pre_ping=True, #checks if connection is still valid if not then create a new one
)



