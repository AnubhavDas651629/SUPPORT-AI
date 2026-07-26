from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "support_ai",
    broker=settings.rabbitmq_url,
    include=["app.workers.tasks"],
)

celery_app.conf.task_routes = {
    "app.workers.tasks.send_ticket_created_email":{
        "queue": "emails",
    },
}