from alembic import autogenerate
from celery.utils.log import get_task_logger
from app.workers.celery_app import celery_app
from asyncio import run
from app.db.session import AsyncSessionLocal
from app.services.email_service import EmailService
from app.services.email_service import EmailService

logger = get_task_logger(__name__)

@celery_app.task(
    autogenerate_for=(Exception,),
    retry_backoff=True,
    retry_jitter=True,
    retry_kwargs={"max_retries": 3},
)
def send_ticket_create_email(ticket_id: str):
    logger.info(f"Executing send_ticket_create_email for ticket: {ticket_id}")
    async def _send():
        async with AsyncSessionLocal() as session:
            service = EmailService(session=session)
            await service.send_ticket_created_email(
                ticket_id=ticket_id
            )
    run(_send())

@celery_app.task(
    retry_backoff=True,
    retry_jitter=True,
    retry_kwargs={"max_retries": 3}
)
def send_otp_email_task(email: str, otp: str):
    logger.info(f"Excecuting send_otp_email_task for: {email}")
    async def _send():
        async with AsyncSessionLocal() as session:
            service = EmailService(session=session)
            await service.send_otp_email(email=email, otp=otp)
    run(_send())

    