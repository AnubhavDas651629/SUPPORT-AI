from app.services.base import BaseService

class EmailService(BaseService):

    async def send_ticket_created_email(self, *, ticket_id: str) -> None:
        print("-" * 60)
        print("EMAIL NOTIFICATION")
        print(f"Ticket Created:{ticket_id}")
        print("Recipitent: support@example.com")
        print("Subject: New Support Ticket")
        print("-" * 60)