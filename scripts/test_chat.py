import asyncio
from uuid import UUID

from app.db.session import AsyncSessionLocal
from app.services.chat_services import ChatService


async def main():
    async with AsyncSessionLocal() as session:

        service = ChatService(session)

        answer = await service.answer(
            knowledge_base_id=UUID(
                "b4c0bb8c-62e4-4b4d-934b-b56ec7b50466"
            ),
            question="Where has he done his intern?",
        )
        print(answer)


if __name__ == "__main__":
    asyncio.run(main())