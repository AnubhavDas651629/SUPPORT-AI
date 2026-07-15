from app.services.base import BaseService
from sqlalchemy.ext.asyncio import AsyncSession


class TicketNoteService(BaseService):
    def __init__(self, session: AsyncSession):
        super().__init__(session)

    async def create_note():
        pass

    async def list_notes():
        pass
    
    async def delete_note():
        pass