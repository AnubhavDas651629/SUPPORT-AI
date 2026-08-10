from uuid import UUID
from cryptography.fernet import Fernet
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.exceptions.auth import PermissionDeniedException
from app.models.user import User
from app.models.webhook import WebhookEndpoint, WebhookDelivery
from app.repositories.webhook_repository import WebhookRepository
from app.services.base import BaseService
from app.services.subscription_service import SubscriptionServices
from app.utils.webhook import generate_webhook_secret

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

            #plan gate: free tier cannot use webhooks
            await self.subscription_service.check_feature_allowed(
                Organization_id=organization_id,
                feature_flag="allow_webhooks",
                current_user=current_user
            )

            #generate raw secret(shown once), then encrypt for storage
            raw_secret = generate_webhook_secret()
            encrypted_secret = self._encrypt(raw_secret)

            endpoint = await self.webhook_repository.create_endpoint(
                orgnization_id=organization_id,
                name=name,
                url=url,
                sercet_encrypted=encrypted_secret,
                subscribed_events=subscribed_events
            )
            await self.session.commit()
            return endpoint, raw_secret #raw secret only returned once

    async def list_endpoints(
        self, *, organization_id: UUID, current_user: User
    ) -> list[WebhookEndpoint]:
        await self._require_member(
            organization_id=organization_id, current_user=current_user
        )
        return await self.webhook_repository.list_endpoints(
            organization_id=organization_id
        )