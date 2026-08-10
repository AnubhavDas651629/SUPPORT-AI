from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, HttpUrl, field_validator

class WebhookEndpointsCreateRequest(BaseModel):
    """
    Customer will submit this to register new webhook url
    """
    name: str
    url: str
    subscribed_events: list[str]

    @field_validator("subscribed_events")
    @classmethod
    def validate_events(cls, events: list[str]) -> list[str]:
        """
        Valid events: "*"(all) or specific dot notation events
        """
        if not events:
            raise ValueError(
                "Subscribed events cannot be empty, Use [*] to recieve all events"
            )
        return events

    @field_validator("url")
    @classmethod
    def validate_url(cls, url: str) -> str:
        if not url.startswith("http://") and not url.startswith("https://"):
            raise ValueError("URL must start with http:// or https://")
        return url

class WebhookEndpointUpdateRequest(BaseModel):
    name: str | None = None
    url: str | None = None
    subscribed_events: list[str] | None = None
    is_active: bool | None = None


class WebhookEndpointCreatedResponse(BaseModel):
    """
    raw secret to be shown ONCE after creation, it will not be returned again
    """
    id: UUID
    name:str
    url:str
    subscribed_events: list[str]
    is_active: bool
    secret:str #raw secret
    created_at: datetime
    model_config = {"from_attributes": True}


class WebhookEndpointResponse(BaseModel):
    """Safe response for list/get/update routes. Never exposes the secret."""
    id: UUID
    name: str
    url: str
    subscribed_events: list[str]
    is_active: bool
    consecutive_failures: int
    created_at: datetime
    model_config = {"from_attributes": True}


class WebhookDeliveryResponse(BaseModel):
    """One row in the delivery log."""
    id: UUID
    endpoint_id: UUID
    event_type: str
    payload: dict
    status_code: int | None = None
    response_body: str | None = None
    duration_ms: int | None = None
    is_success: bool
    attempt_number: int
    created_at: datetime
    model_config = {"from_attributes": True}

    
class WebhookTestResponse(BaseModel):
    """Result of manually pinging a webhook endpoint."""
    success: bool
    status_code: int | None = None
    response_body: str | None = None
    duration_ms: int | None = None
    message: str
    