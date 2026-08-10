from enum import Enum
class WebhookEventType(Enum):
    TICKET_CREATED = "ticket.created"
    TICKET_UPDATED = "ticket.updated"
    TICKET_ASSIGNED = "ticket.assigned"
    TICKET_RESOLVED = "ticket.resolved"
    CONVERSATION_CREATED = "conversation.created"
    MESSAGE_CREATED = "message.created"
    FEEDBACK_SUBMITTED = "feedback.submitted"
    ALL = "*"
# List of all valid choices for easy validation & UI dropdowns
ALL_WEBHOOK_EVENTS = [e.value for e in WebhookEventType]