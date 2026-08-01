# Create SQLALchemy engine -> to connect to Postgres SQL
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings

engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_pre_ping=True,   # Checks if connection is still valid; if not, creates a new one
    pool_size=20,         # Maintains 20 persistent connections in memory
    max_overflow=10,      # Allows up to 10 extra temporary connections during traffic spikes
    pool_timeout=30,      # Waits up to 30 seconds for a free connection before timing out
    pool_recycle=1800,    # Recycles idle connections every 30 minutes to prevent stale sockets
)

# Pool tuning -> Under heavy concurrent API traffic, 
# creating a new TCP database connection for every request is extremely expensive 
# (~30–100ms per request). Connection pooling keeps a pool of 
# ready-to-use connections in memory.


