from app.db.session import AsyncSessionLocal
from app.utils.webhook_dispatch import _dispatch_direct
import asyncio

async def test():
    print("Testing message.created for dae6d081-1748-4bc5-ba96-163a97c41a11")
    await _dispatch_direct(
        "dae6d081-1748-4bc5-ba96-163a97c41a11",
        "message.created",
        {"test": "payload"}
    )

if __name__ == "__main__":
    asyncio.run(test())
