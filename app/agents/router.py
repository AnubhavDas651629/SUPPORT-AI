#we are classifying user queries into different categories
#if it's a technical question, ai will detect and route to the technical ai agent, and so forth for all situations

from enum import Enum
from pydantic import BaseModel
from app.processing.llms.factory import LLMFactory

#allowed routes
class ConversationRoute(str, Enum):
    BILLING = "billing"
    TECHNICAL = "technical"
    GENERAL = "general"

#JSON structure the AI must return in
class RouterResponse(BaseModel):
    route: ConversationRoute
    confidence: float
    reason: str

#router agent
class AgentRouter:
    def __init__(self):
        self.llm = LLMFactory.get_provider()

    async def route_conversation(self, question:str) -> ConversationRoute:
        messages = [
            {
                "role": "system",
                "content": "You are a highly intelligent routing agent. Analyse the user's message and categorize it into BILLING(refunds, pricing, subscriptions), TECHNICAL(bugs, how-tos, erros) or GENERAL(anything else)"
            },
            {
                "role": "user",
                "content": question
            }
        ]
        response = await self.llm.complete_structured(
            messages=messages,
            response_model=RouterResponse
        )
        print(f" Router Decision: {response.route} (confidence: {response.confidence})")
        return response.route
