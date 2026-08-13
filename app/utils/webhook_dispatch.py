"""
Smart webhook event dispatcher with Celery-first, async-fallback strategy.

In production with Celery workers running:
  → Events are queued via RabbitMQ for reliable, retryable delivery.

In development without Celery:
  → Events fire directly as async background tasks in the FastAPI event loop,
    so webhooks still reach external servers during local testing.
"""

import asyncio
import logging
from uuid import UUID
from app.core.config import settings

logger = logging.getLogger(__name__)


def fire_webhook_event(organization_id: str, event_type: str, data: dict) -> None:
    """
    Dispatch a webhook event.
    Tries Celery first; if the broker is unreachable, falls back
    to direct async dispatch inside the running event loop.
    """
    # 1. Try Celery (production path)
    if not settings.debug:
        try:
            from app.workers.tasks import dispatch_webhook_event_task

            dispatch_webhook_event_task.delay(organization_id, event_type, data)
            return
        except Exception as exc:
            logger.warning(
                "Celery broker unavailable (%s). Falling back to direct async dispatch for %s.",
                exc,
                event_type,
            )

    # 2. Fallback: fire directly in the current event loop
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(
            _dispatch_direct(organization_id, event_type, data)
        )
    except RuntimeError:
        logger.error(
            "No running event loop — cannot dispatch webhook %s for org %s.",
            event_type,
            organization_id,
        )


async def _dispatch_direct(
    organization_id: str, event_type: str, data: dict
) -> None:
    """Run the webhook dispatcher inline (no Celery)."""
    try:
        from app.services.webhook_dispatcher import WebhookDispatcher

        logger.info(
            "Direct webhook dispatch starting: event=%s org=%s",
            event_type, organization_id,
        )
        dispatcher = WebhookDispatcher()
        await dispatcher.dispatch_event(
            organization_id=UUID(organization_id),
            event_type=event_type,
            data=data,
        )
        logger.info(
            "Direct webhook dispatch completed: %s for org %s",
            event_type,
            organization_id,
        )
    except Exception as exc:
        logger.error(
            "Direct webhook dispatch FAILED for event=%s org=%s: %s",
            event_type, organization_id, exc,
            exc_info=True,
        )
