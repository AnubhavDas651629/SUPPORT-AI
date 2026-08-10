from uuid import UUID
from cryptography.fernet import Fernet
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.exceptions.webhook import WebhookNotFoundException
from app.models.user import User
from app.models.webhook import WebhookEndpoint, WebhookDelivery
from app.repositories.webhook_repository import WebhookRepository
from app.services.base import BaseService
from app.services.subscription_service import SubscriptionServices
from app.utils.webhook import generate_webhook_secret
from app.services.webhook_dispatcher import WebhookDispatcher

class WebhookService(BaseService):
    def __init__(self, session: AsyncSession):
        super().__init__(session)
        self.webhook_repository = WebhookRepository(session)
        self.subscription_service = SubscriptionServices(session)
        self._fernet = Fernet(settings.webhook_encryption_key.encode())  # Fernet is a symmetric encryption cipher (AES-128-CBC + HMAC-SHA256)

    def _encrypt(self, raw_secret:str) -> str:
        """encrypt raw secret before saving to DB"""
        return self._fernet.encrypt(raw_secret.encode()).decode()

    def _decrypt(self, encrypted: str) -> str:
        """Decrypt stored ciphertext back to raw secret when needed for signing."""
        return self._fernet.decrypt(encrypted.encode()).decode()

    async def create_endpoint(
        self,
        *,
        organization_id: UUID,
        current_user: User,
        name: str,
        url: str,
        subscribed_events: list[str],
    ) -> tuple[WebhookEndpoint, str]:
        await self._require_owner(
            organization_id=organization_id,
            current_user=current_user
        )

        # Plan gate: free tier cannot use webhooks
        await self.subscription_service.check_feature_allowed(
            Organization_id=organization_id,
            feature_flag="allows_webhooks",
            current_user=current_user
        )

        # Generate raw secret (shown once), then encrypt for storage
        raw_secret = generate_webhook_secret()
        encrypted_secret = self._encrypt(raw_secret)

        endpoint = await self.webhook_repository.create_endpoint(
            organization_id=organization_id,
            name=name,
            url=url,
            secret_encrypted=encrypted_secret,
            subscribed_events=subscribed_events
        )
        await self.session.commit()
        return endpoint, raw_secret  # raw secret only returned once

    async def list_endpoints(
        self, *, organization_id: UUID, current_user: User
    ) -> list[WebhookEndpoint]:
        await self._require_member(
            organization_id=organization_id, current_user=current_user
        )
        return await self.webhook_repository.list_endpoints(
            organization_id=organization_id
        )

    async def get_endpoint(
        self, *, organization_id: UUID, endpoint_id: UUID, current_user: User
    ) -> WebhookEndpoint:
        await self._require_member(
            organization_id=organization_id, current_user=current_user
        )
        endpoint = await self.webhook_repository.get_endpoint_by_id(
            endpoint_id=endpoint_id, organization_id=organization_id
        )
        if endpoint is None:
            raise WebhookNotFoundException()
        return endpoint


    async def update_endpoint(
        self,
        *,
        organization_id: UUID,
        endpoint_id: UUID,
        current_user: User,
        name: str | None = None,
        url: str | None = None,
        subscribed_events: list[str] | None = None,
        is_active: bool | None = None,
    ) -> WebhookEndpoint:
        await self._require_owner(
            organization_id=organization_id, current_user=current_user
        )
        endpoint = await self.webhook_repository.get_endpoint_by_id(
            endpoint_id=endpoint_id, organization_id=organization_id
        )
        if endpoint is None:
            raise WebhookNotFoundException()
        updated = await self.webhook_repository.update_endpoint(
            endpoint=endpoint,
            name=name,
            url=url,
            subscribed_events=subscribed_events,
            is_active=is_active,
        )
        await self.session.commit()
        return updated


    async def delete_endpoint(
        self, *, organization_id: UUID, endpoint_id: UUID, current_user: User
    ) -> None:
        await self._require_owner(
            organization_id=organization_id, current_user=current_user
        )
        endpoint = await self.webhook_repository.get_endpoint_by_id(
            endpoint_id=endpoint_id, organization_id=organization_id
        )
        if endpoint is None:
            raise WebhookNotFoundException()
        await self.webhook_repository.delete_endpoint(endpoint=endpoint)
        await self.session.commit()


    async def test_endpoint(
        self, *, organization_id: UUID, endpoint_id: UUID, current_user: User
    ) -> dict:
        """
        Send a manual test ping event to the endpoint.
        Returns the delivery result so customer can verify their server
        is receiving webhooks correctly.
        """
        endpoint = await self.get_endpoint(
            organization_id=organization_id,
            endpoint_id=endpoint_id,
            current_user=current_user,
        )
        raw_secret = self._decrypt(endpoint.secret_encrypted)
        test_payload = {
            "event": "ping",
            "message": "This is a test webhook from SupportAI.",
            "organization_id": str(organization_id),
        }
        dispatcher = WebhookDispatcher()
        result = await dispatcher.send_once(
            url=endpoint.url,
            secret=raw_secret,
            payload=test_payload,
        )
        return result

    async def list_deliveries(
        self, *, organization_id: UUID, endpoint_id: UUID, current_user: User
    ) -> list[WebhookDelivery]:
        await self.get_endpoint(  # validates membership + endpoint ownership
            organization_id=organization_id,
            endpoint_id=endpoint_id,
            current_user=current_user,
        )
        return await self.webhook_repository.list_deliveries(endpoint_id=endpoint_id)



