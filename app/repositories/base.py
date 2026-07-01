from sqlalchemy.ext.asyncio import AsyncSession

class BaseRepository:
    def __init__(self, session, Asyncsession):
        self.session = session