from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

celery_app = Celery(
    "support-ai",
    broker = settings.rabbitmq_url,
    include=["app.workers.tasks"]
)

# Celery Configuration
celery_app.conf.update( 
    task_serializer="json",  #tells Celery to convert task arguments into a standard JSON string (e.g., {"email": "user@example.com", "otp": "123456"}) before sending it to RabbitMQ.
    result_serializer="json", #Dictates that any value returned by a task (e.g., return "Cleanup completed") will also be encoded into JSON format.
    accept_content=["json"], #Acts as a security guard whitelist. It tells Celery workers: "Only accept and execute task messages formatted in JSON. Ignore/reject any untrusted formats like pickle or yaml."
    timezone="UTC",
    enable_utc=True,

# 1. Task Queue & Priority Routing
    task_routes={
        "app.workers.tasks.send_otp_email_task": {
            "queue": "high_priority",
        },
        "app.workers.tasks.send_ticket_create_email": {
            "queue": "emails",
        },
        "app.workers.tasks.send_org_invite_email_task": {
            "queue": "emails",
        },
        "app.workers.tasks.dispatch_webhook_event_task": {
            "queue": "webhooks"
        },
        "app.workers.tasks.compress_conversation_memory_task": {
            "queue": "background_tasks"
        }
    },


    
    # 2. Celery Beat Periodic Scheduled Jobs
    beat_schedule={
        # Delete expired user sessions from PostgreSQL every hour
        "cleanup-expired-sessions-every-hour": {
            "task": "app.workers.tasks.cleanup_expired_sessions_task",
            "schedule": 3600.0,  # 3600 seconds = 1 hour
        },
    },
)

"""
The Problem
Some tasks must run on a recurring schedule without any user trigger:

Cleaning up expired OTP tokens every 15 minutes.
Evicting old temp files every night at midnight.
Sending daily summary reports to admins every morning at 8:00 AM.
The Solution: Celery Beat
Celery Beat is a periodic task scheduler. It runs alongside Celery workers and ticks like a cron clock, triggering scheduled tasks into RabbitMQ/Redis at specified intervals (crontab or schedule=300.0).

"""
