from sqlalchemy.ext.asyncio import AsyncSession

class BaseRepository:
    def __init__(self, session):
        self.session = session