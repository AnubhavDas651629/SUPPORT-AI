import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings

async def cleanup():
    print("🧹 Connecting to database to clean up Locust virtual users...")
    engine = create_async_engine(settings.database_url, echo=False)
    
    async with engine.begin() as conn:
        # Delete any user whose email starts with 'loadtest_'
        result = await conn.execute(text("DELETE FROM users WHERE email LIKE 'loadtest_%'"))
        print(f"✅ Successfully deleted {result.rowcount} fake load-test users from the database!")
        
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(cleanup())
