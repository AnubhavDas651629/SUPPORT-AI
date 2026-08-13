import asyncio
import httpx
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.core.security import create_access_token
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as session:
        user = (await session.execute(select(User).where(User.email == 'anubhavdas651@gmail.com'))).scalar_one_or_none()
        if not user:
            print("User not found")
            return
        token = create_access_token(str(user.id))
        
    async with httpx.AsyncClient() as client:
        # First get KBs
        headers = {"Authorization": f"Bearer {token}"}
        kb_resp = await client.get("http://localhost:8000/api/v1/organizations/57a8ca9b-be34-44cc-9625-3ce4b068773d/knowledge-bases", headers=headers)
        if kb_resp.status_code != 200:
            print(f"Failed to get KBs: {kb_resp.status_code} {kb_resp.text}")
            return
            
        kbs = kb_resp.json()
        kb_id = kbs[0]['id'] if kbs else None
        print(f"Found KB ID: {kb_id}")
        
        # Now test chat stream
        payload = {
            "conversation_id": None,
            "knowledge_base_id": kb_id,
            "organization_id": "57a8ca9b-be34-44cc-9625-3ce4b068773d",
            "question": "hello"
        }
        
        print(f"Sending payload: {payload}")
        chat_resp = await client.post("http://localhost:8000/api/v1/chat/stream", json=payload, headers=headers)
        print(f"Chat stream response: {chat_resp.status_code}")
        print(f"Chat stream body: {chat_resp.text}")

asyncio.run(main())
