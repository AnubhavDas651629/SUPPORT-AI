from datetime import UTC, datetime
from celery.utils.log import get_task_logger
from sqlalchemy import delete
from app.workers.celery_app import celery_app
from asyncio import run
from app.db.session import AsyncSessionLocal
from app.services.email_service import EmailService
from app.models.user_session import UserSession

logger = get_task_logger(__name__)

@celery_app.task(
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=600,
    retry_jitter=True,
    max_retries=True,
)
def send_ticket_create_email(ticket_id:str):
    logger.info(f"Excecuting send_ticket_create_email for ticket: {ticket_id}")
    async def _send():
        async with AsyncSessionLocal() as session:
            service = EmailService(session=session)
            await service.send_ticket_created_email(
                ticket_id=ticket_id
            )
    run(_send())

# 2. High-Priority OTP Email Task
@celery_app.task(
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=300,
    retry_jitter=True,
    max_retries=3,
)
def send_otp_email_task(email: str, otp: str):
    logger.info(f"Executing send_otp_email_task for: {email}")
    async def _send():
        async with AsyncSessionLocal() as session:
            service = EmailService(session=session)
            await service.send_otp_email(email=email, otp=otp)
    run(_send())
    
# 3. Scheduled Celery Beat Task: Expired User Session Cleanup
@celery_app.task
def cleanup_expired_sessions_task():
    logger.info("Executing periodic task: cleanup_expired_sessions_task")
    async def _cleanup():
        async with AsyncSessionLocal() as session:
            stmt = delete(UserSession).where(UserSession.expires_at < datetime.now(UTC))
            result = await session.execute(stmt)
            await session.commit()
            logger.info(f"Deleted {result.rowcount} expired user sessions from database.")
    run(_cleanup())

    