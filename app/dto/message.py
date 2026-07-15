from pydantic import BaseModel

class SupportReplyRequest(BaseModel):
    content: str