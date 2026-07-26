import logging
from app.services.base import BaseService
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

class EmailService(BaseService):

    def __init__(self, session: AsyncSession):
        super().__init__(session)
        self.session = session

    async def send_ticket_created_email(self, *, ticket_id: str) -> None:
        msg = f"\n{'='*60}\nEMAIL NOTIFICATION\nTicket Created: {ticket_id}\nRecipient: support@example.com\nSubject: New Support Ticket\n{'='*60}\n"
        print(msg, flush=True)
        logger.info(msg)