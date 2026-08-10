from uuid import UUID
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.dependencies import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.webhook import (
    WebhookDeliveryResponse,
    WebhookEndpointCreateRequest,
    WebhookEndpointCreatedResponse,
    WebhookEndpointResponse,
    WebhookEndpointUpdateRequest,
    WebhookTestResponse,
)
from app.services.webhook_services import WebhookService

router = APIRouter(
    prefix="/organizations/{organization_id}/webhooks",
    tags=["Webhooks"],
)

@router.post("", response_model=WebhookEndpointCreatedResponse, status_code=201)
async def create_webhook(
    organization_id: UUID,
    body: WebhookEndpointCreateRequest,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Register a new webhook endpoint. Owner only. Requires Pro/Enterprise plan.
    The raw signing secret is returned ONCE — save it securely!
    """
    service = WebhookService(session)
    endpoint, raw_secret = await service.create_endpoint(
        organization_id=organization_id,
        current_user=current_user,
        name=body.name,
        url=body.url,
        subscribed_events=body.subscribed_events,
    )
    return WebhookEndpointCreatedResponse(
        id=endpoint.id,
        name=endpoint.name,
        url=endpoint.url,
        subscribed_events=endpoint.subscribed_events,
        is_active=endpoint.is_active,
        secret=raw_secret,  # ← Shown only once
        created_at=endpoint.created_at,
    )
@router.get("", response_model=list[WebhookEndpointResponse])
async def list_webhooks(
    organization_id: UUID,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all registered webhook endpoints for this organization."""
    service = WebhookService(session)
    return await service.list_endpoints(
        organization_id=organization_id,
        current_user=current_user,
    )

@router.get("/{endpoint_id}", response_model=WebhookEndpointResponse)
async def get_webhook(
    organization_id: UUID,
    endpoint_id: UUID,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get details of a specific webhook endpoint."""
    service = WebhookService(session)
    try:
        return await service.get_endpoint(
            organization_id=organization_id,
            endpoint_id=endpoint_id,
            current_user=current_user,
        )
    except WebhookNotFoundException:
        raise HTTPException(status_code=404, detail="Webhook endpoint not found.")


@router.patch("/{endpoint_id}", response_model=WebhookEndpointResponse)
async def update_webhook(
    organization_id: UUID,
    endpoint_id: UUID,
    body: WebhookEndpointUpdateRequest,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update URL, event subscriptions, or active status. Owner only."""
    service = WebhookService(session)
    try:
        return await service.update_endpoint(
            organization_id=organization_id,
            endpoint_id=endpoint_id,
            current_user=current_user,
            name=body.name,
            url=body.url,
            subscribed_events=body.subscribed_events,
            is_active=body.is_active,
        )
    except WebhookNotFoundException:
        raise HTTPException(status_code=404, detail="Webhook endpoint not found.")

@router.delete("/{endpoint_id}", status_code=204)
async def delete_webhook(
    organization_id: UUID,
    endpoint_id: UUID,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a webhook endpoint permanently. Owner only."""
    service = WebhookService(session)
    try:
        await service.delete_endpoint(
            organization_id=organization_id,
            endpoint_id=endpoint_id,
            current_user=current_user,
        )
    except WebhookNotFoundException:
        raise HTTPException(status_code=404, detail="Webhook endpoint not found.")


@router.post("/{endpoint_id}/test", response_model=WebhookTestResponse)
async def test_webhook(
    organization_id: UUID,
    endpoint_id: UUID,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Send an instant test ping to this webhook URL.
    Returns the HTTP status code and response body so you can
    verify your server is receiving events correctly.
    """
    service = WebhookService(session)
    try:
        result = await service.test_endpoint(
            organization_id=organization_id,
            endpoint_id=endpoint_id,
            current_user=current_user,
        )
        return WebhookTestResponse(**result)
    except WebhookNotFoundException:
        raise HTTPException(status_code=404, detail="Webhook endpoint not found.")

        
@router.get("/{endpoint_id}/deliveries", response_model=list[WebhookDeliveryResponse])
async def list_deliveries(
    organization_id: UUID,
    endpoint_id: UUID,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """View the delivery log for a webhook endpoint — useful for debugging failures."""
    service = WebhookService(session)
    try:
        return await service.list_deliveries(
            organization_id=organization_id,
            endpoint_id=endpoint_id,
            current_user=current_user,
        )
    except WebhookNotFoundException:
        raise HTTPException(status_code=404, detail="Webhook endpoint not found.")