import json 
import time
from datetime import datetime, UTC
from uuid import UUID, uuid4

import httpx
from cryptography.fernet import Fernet

from app.core.config import settings
from app.db.dependencies import get_db
from app.repositories.webhook_repository import WebhookRepository
from app.utils.webhook import sign_webhook_payload


class WebhookDispatcher:
    """
    Handles outbounf HTTP delivery of webhook events to customer servers
    1. send_once()      -> Used by 'Test Webhook' button for instant response.
    2. dispatch_event() -> Used in background tasks when tickets/messages happen.    
    """

    TIMEOUT_SECONDS = 10
    MAX_RESPONSE_BODY_LENGTH = 1000

    async def send_once(self, *, url:str, secret:str, payload:dict) -> dict:
        """
        Sends a single test HTTP post req to a url and returns result details
        """
        payload_bytes = json.dumps(payload, default=str).encode("utf-8")
        signature_header = sign_webhook_payload(secret=secret, payload=payload_bytes)
        start = time.monotonic()
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url,
                    content=payload_bytes,
                    headers={
                        "Content-Type": "application/json",
                        "X-SupportAI-Signature": signature_header,
                        "User-Agent": "SupportAI-Webhook/1.0",
                    },
                    timeout=self.TIMEOUT_SECONDS,
                )
            duration_ms = int((time.monotonic() - start) * 1000)
            is_success = 200 <= response.status_code < 300
            response_body = response.text[:self.MAX_RESPONSE_BODY_LENGTH]
            return {
                "success": is_success,
                "status_code": response.status_code,
                "response_body": response_body,
                "duration_ms": duration_ms,
                "message": "Delivery successful." if is_success else f"Server returned {response.status_code}.",
            }
        except httpx.TimeoutException:
            duration_ms = int((time.monotonic() - start) * 1000)
            return {
                "success": False,
                "status_code": None,
                "response_body": None,
                "duration_ms": duration_ms,
                "message": "Request timed out after 10 seconds.",
            }
        except Exception as exc:
            return {
                "success": False,
                "status_code": None,
                "response_body": None,
                "duration_ms": None,
                "message": f"Network error: {str(exc)}",
            }        

    async def dispatch_event(
        self,
        *,
        organization_id: UUID,
        event_type: str,
        data: dict,
    ) -> None:
        """
        Fires an event to all active endpoints subscribed to it.
        Runs asynchronously in the background.
        """
        payload = {
            "id": str(uuid4()),
            "event": event_type,
            "created_at": datetime.now(UTC).isoformat(),
            "organization_id": str(organization_id),
            "data": data,
        }
        payload_bytes = json.dumps(payload, default=str).encode("utf-8")
        # Open an independent database session for the background task
        async for session in get_db():
            repo = WebhookRepository(session)
            endpoints = await repo.get_active_endpoints_for_event(
                organization_id=organization_id,
                event_type=event_type,
            )
            if not endpoints:
                return
            fernet = Fernet(settings.webhook_encryption_key.encode())
            for endpoint in endpoints:
                raw_secret = fernet.decrypt(endpoint.secret_encrypted.encode()).decode()
                signature_header = sign_webhook_payload(
                    secret=raw_secret, payload=payload_bytes
                )
                start = time.monotonic()
                status_code = None
                response_body = None
                is_success = False
                try:
                    async with httpx.AsyncClient() as client:
                        response = await client.post(
                            endpoint.url,
                            content=payload_bytes,
                            headers={
                                "Content-Type": "application/json",
                                "X-SupportAI-Signature": signature_header,
                                "User-Agent": "SupportAI-Webhook/1.0",
                            },
                            timeout=self.TIMEOUT_SECONDS,
                        )
                    duration_ms = int((time.monotonic() - start) * 1000)
                    status_code = response.status_code
                    response_body = response.text[:self.MAX_RESPONSE_BODY_LENGTH]
                    is_success = 200 <= status_code < 300
                except httpx.TimeoutException:
                    duration_ms = int((time.monotonic() - start) * 1000)
                    response_body = "Timeout after 10s"
                except Exception as exc:
                    duration_ms = int((time.monotonic() - start) * 1000)
                    response_body = f"Network error: {str(exc)}"
                # Log the delivery attempt in database
                await repo.create_delivery_log(
                    endpoint_id=endpoint.id,
                    event_type=event_type,
                    payload=payload,
                    status_code=status_code,
                    response_body=response_body,
                    duration_ms=duration_ms,
                    is_success=is_success,
                )
                # Track failure count
                if is_success:
                    await repo.reset_failures(endpoint=endpoint)
                else:
                    await repo.increment_failure(endpoint=endpoint)
                await session.commit()