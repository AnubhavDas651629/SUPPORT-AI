from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "support_ai",
    broker=settings.rabbitmq_url,
)

celery_app.autodiscover_tasks(
    [
        "app.workers",
    ]
)