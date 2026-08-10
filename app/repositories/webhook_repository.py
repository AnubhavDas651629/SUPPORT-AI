from uuid import UUID
from sqlalchemy import select
from app.models.webhook import WebhookDelivery, WebhookEndpoint
from app.repositories.base import BaseRepository


class WebhookRepository(BaseRepository):
    async def create_endpoint(self, *, orgnization_id:UUID, name:str, url:str, sercet_encrypted:str, subscribed_events: list[str])-> WebhookEndpoint:
        endpoint = WebhookEndpoint(
            orgnization_id=orgnization_id,
            name=name, 
            url=url,
            secret_encrypted=sercet_encrypted,
            subscribed_events=subscribed_events,
            is_active=True,
            consecutive_failures=0
        )
        self.session.add(endpoint)
        await self.session.flush()
        return endpoint


    async def get_endpoint_by_id(self, *, endpoint_id:UUID, organization_id:UUID) ->WebhookEndpoint | None:
        stmt = (
            select(WebhookEndpoint)
            .where(
                WebhookEndpoint.id == endpoint_id,
                WebhookEndpoint.organization_id == organization_id
            )
        )
        result = self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_endpoints(self, *, organization_id:UUID) -> list[WebhookEndpoint]:
        stmt = (
            select(WebhookEndpoint)
            .where(WebhookEndpoint.organization_id == organization_id)
            .order_by(WebhookEndpoint.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_active_endpoints_for_event(self, *, organization_id:UUID, event_type:str) -> list[WebhookEndpoint]:
        all_endpoints = await self.list_endpoints(organization_id=organization_id)

        matching = []
        for endpoint in all_endpoints:
            if not endpoint.is_active:
                continue
            events = endpoint.subscribed_events or []
            if "*" in events or event_type in events:
                matching.append(endpoint)
        return matching

    async def update_endpoint(
        self,
        *,
        endpoint: WebhookEndpoint,
        name: str | None = None,
        url: str | None = None,
        subscribed_events: list[str] | None = None,
        is_active: bool | None = None,
    ) -> WebhookEndpoint:

        if name is not None:
            endpoint.name = name
        if url is not None:
            endpoint.url = url
        if subscribed_events is not None:
            endpoint.subscribed_events = subscribed_events
        if is_active is not None:
            endpoint.is_active = is_active
        await self.session.flush()
        return endpoint


    async def delete_endpoint(self, *, endpoint: WebhookEndpoint) -> None:
        await self.session.delete(endpoint)
        await self.session.flush()

    async def increment_failure(self, *, endpoint: WebhookEndpoint) -> None:
        """Increment consecutive_failures Auto disable at 50."""
        endpoint.consecutive_failures += 1
        if endpoint.consecutive_failures >= 50:
            endpoint.is_active = False
        await self.session.flush()

    async def reset_failures(self, *, endpoint: WebhookEndpoint) -> None:
        """Reset counter on successful delivery."""
        endpoint.consecutive_failures = 0
        await self.session.flush()


# Deliver logs start here
    async def create_delivery_log(
        self,
        *,
        endpoint_id: UUID,
        event_type: str,
        payload: dict,
        status_code: int | None,
        response_body: str | None,
        duration_ms: int | None,
        is_success: bool,
        attempt_number: int = 1,
    ) -> WebhookDelivery:
        delivery = WebhookDelivery(
            endpoint_id=endpoint_id,
            event_type=event_type,
            payload=payload,
            status_code=status_code,
            response_body=response_body,
            duration_ms=duration_ms,
            is_success=is_success,
            attempt_number=attempt_number,
        )
        self.session.add(delivery)
        await self.session.flush()
        return delivery


    async def list_deliveries(
        self, *, endpoint_id: UUID, limit: int = 50
    ) -> list[WebhookDelivery]:
        stmt = (
            select(WebhookDelivery)
            .where(WebhookDelivery.endpoint_id == endpoint_id)
            .order_by(WebhookDelivery.created_at.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())