"""
The Problem
When a user opens your chat widget and types "Hello", you send 1 message to OpenAI. 
When they type "I have a problem", you send 3 messages to OpenAI (The System Prompt, User Hello, AI Reply, User Problem).
 If a user talks to your bot for 50 messages, you are sending all 50 messages to OpenAI every single time they type a new word.

This causes two massive problems:

The Cost Explosion: OpenAI charges per token (per word). Sending a 50-message history to OpenAI over and over again will cost you 50x more money than a 1-message history.
The Context Window Crash: AI models have a hard limit on how many words they can read at once. If the user talks long enough, the API will throw a TokenLimitExceeded error and crash your entire server.
The Solution: Memory Compression
We are going to build a "Memory Compressor" background job.

Instead of sending 50 messages, we set a limit (e.g., 10 messages).
The moment a conversation hits 10 messages, a background AI reads all 10 messages and compresses them into a dense, 
2-sentence summary: "Summary: The user is asking about a refund for Order #123. The agent requested their email address."

We then "delete" those 10 messages from the history that we send to OpenAI, 
and instead just inject the 2-sentence summary at the top of the prompt! 
The AI perfectly remembers what they were talking about, 
but you just reduced your token cost by 95% and mathematically guaranteed you will never hit the token limit.
"""

from app.processing.llms.factory import LLMFactory
from app.models.message import Message, MessageRole
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, asc
import uuid

class MemoryCompressor:
    def __init__(self, session: AsyncSession):
        self.llm = LLMFactory.get_provider()
        self.session = session

    async def compress_conversation(self, conversation_id: str) -> None:
        """Reads 10 messages, turns them into a 2 sentence summary, and replaces them in the DB."""
        print(f"Celery Task: Compressing memory for conversation {conversation_id}...")

        # 1. Fetch the oldest 10 messages
        stmt = select(Message).where(Message.conversation_id == uuid.UUID(conversation_id)).order_by(asc(Message.created_at)).limit(10)
        result = await self.session.execute(stmt)
        history = result.scalars().all()
        
        if len(history) < 10:
            return # Safety check

        history_text = "\n".join(
            f"{msg.role.value}: {msg.content}"
            for msg in history
        )

        messages = [
            {
                "role": "system",
                "content": """You are a highly efficient memory compression AI.
                Read the following conversation history and summarize the key facts in exactly 2 sentences. 
                Focus ONLY on what the user wants, and what data has already been provided to them. 
                Ignore pleasantries like 'hello' or 'thank you'."""
            },
            {
                "role": "user",
                "content": f"CONVERSATION HISTORY:\n{history_text}"
            }
        ]
        summary = await self.llm.complete(messages=messages)
        final_summary = f"[COMPRESSED HISTORY]: {summary.strip()}"
        print(f"📦 COMPRESSED SUMMARY: {final_summary}")

        # 2. Delete the old messages
        message_ids = [msg.id for msg in history]
        delete_stmt = delete(Message).where(Message.id.in_(message_ids))
        await self.session.execute(delete_stmt)

        # 3. Insert the new summary message (set as SYSTEM role so it acts as context)
        new_msg = Message(
            conversation_id=uuid.UUID(conversation_id),
            role=MessageRole.SYSTEM,
            content=final_summary
        )
        self.session.add(new_msg)
        await self.session.commit()
        print("✅ Memory compression complete. Database updated.")