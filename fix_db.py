import asyncio
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.organization_member import OrganizationMember
from app.models.organization import Organization
from sqlalchemy import select, delete

async def main():
    async with AsyncSessionLocal() as session:
        # Get both users
        user_upper = (await session.execute(select(User).where(User.email == "Anubhavdas651@gmail.com"))).scalar_one_or_none()
        user_lower = (await session.execute(select(User).where(User.email == "anubhavdas651@gmail.com"))).scalar_one_or_none()
        
        if user_upper and user_lower:
            print("Found both users. Deleting the empty lowercase user and standardizing the uppercase one.")
            
            # Delete memberships of lowercase user
            await session.execute(delete(OrganizationMember).where(OrganizationMember.user_id == user_lower.id))
            
            # Delete lowercase user
            await session.execute(delete(User).where(User.id == user_lower.id))
            
            # Standardize uppercase user email to lowercase
            user_upper.email = "anubhavdas651@gmail.com"
            # Update google_sub if the lower one had it
            if user_lower.google_sub and not user_upper.google_sub:
                user_upper.google_sub = user_lower.google_sub
                
            await session.commit()
            print("Database fixed!")
        else:
            print("Could not find one of the users.")

asyncio.run(main())
