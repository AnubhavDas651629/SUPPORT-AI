from datetime import datetime
from email import message
from uuid import UUID
from pydantic import BaseModel, ConfigDict

from app.models.message_feedback import FeedbackType


class MessageFeedbackRequest(BaseModel):
    feedback: FeedbackType

class MessageFeedbackResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    message_id: UUID
    feedback: FeedbackType
    created_at: datetime
