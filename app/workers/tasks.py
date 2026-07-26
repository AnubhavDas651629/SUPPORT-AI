from app.workers.celery_app import celery_app
from asyncio import run
from app.db.session import AsyncSessionLocal
from app.services.email_service import EmailService

@celery_app.task
def send_ticket_create_email(ticket_id: str):
    async def _send():
        async with AsyncSessionLocal() as session:
            service = EmailService()
            await service.send_ticket_created_email(
                ticket_id=ticket_id
            )
        run(_send())