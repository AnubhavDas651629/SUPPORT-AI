from datetime import UTC, datetime
from uuid import UUID

def serialize_ticket_payload(ticket, extra: dict | None = None) -> dict:
    """Build standardized JSON payload for ticket webhook events."""
    data = {
        "id": str(ticket.id),
        "conversation_id": str(ticket.conversation_id),
        "organization_id": str(ticket.organization_id),
        "subject": ticket.subject,
        "status": ticket.status.value if hasattr(ticket.status, "value") else str(ticket.status),
        "priority": ticket.priority.value if hasattr(ticket.priority, "value") else str(ticket.priority),
        "created_by_ai": ticket.created_by_ai,
        "assigned_to_user_id": str(ticket.assigned_to_user_id) if getattr(ticket, "assigned_to_user_id", None) else None,
        "created_at": ticket.created_at.isoformat() if getattr(ticket, "created_at", None) else datetime.now(UTC).isoformat(),
    }
    if extra:
        data.update(extra)
    return data


def serialize_conversation_payload(conversation, extra: dict | None = None) -> dict:
    """Build standardized JSON payload for conversation webhook events."""
    data = {
        "id": str(conversation.id),
        "organization_id": str(conversation.organization_id),
        "knowledge_base_id": str(conversation.knowledge_base_id) if getattr(conversation, "knowledge_base_id", None) else None,
        "title": conversation.title,
        "created_at": conversation.created_at.isoformat() if getattr(conversation, "created_at", None) else datetime.now(UTC).isoformat(),
    }
    if extra:
        data.update(extra)
    return data


def serialize_message_payload(message, organization_id: UUID | str, extra: dict | None = None) -> dict:
    """Build standardized JSON payload for message webhook events."""
    data = {
        "id": str(message.id),
        "conversation_id": str(message.conversation_id),
        "organization_id": str(organization_id),
        "role": message.role.value if hasattr(message.role, "value") else str(message.role),
        "content": message.content,
        "created_at": message.created_at.isoformat() if getattr(message, "created_at", None) else datetime.now(UTC).isoformat(),
    }
    if extra:
        data.update(extra)
    return data


def serialize_feedback_payload(feedback, conversation_id: UUID | str, organization_id: UUID | str, extra: dict | None = None) -> dict:
    """Build standardized JSON payload for feedback webhook events."""
    feedback_val = feedback.feedback.value if hasattr(feedback.feedback, "value") else str(feedback.feedback)
    data = {
        "id": str(feedback.id),
        "message_id": str(feedback.message_id),
        "conversation_id": str(conversation_id),
        "organization_id": str(organization_id),
        "feedback": feedback_val,
        "created_at": feedback.created_at.isoformat() if getattr(feedback, "created_at", None) else datetime.now(UTC).isoformat(),
    }
    if extra:
        data.update(extra)
    return data
