import smtplib
from email.message import EmailMessage
import logging
from app.services.base import BaseService
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from uuid import UUID
from app.repositories.ticket_repositories import TicketRepository
from app.services.organization_settings_service import OrganizationSettingsService

logger = logging.getLogger(__name__)

class EmailService(BaseService):

    def __init__(self, session: AsyncSession):
        super().__init__(session)
        self.session = session

    def _send_smtp_email(self, *, to_email: str, subject: str, body_text: str, body_html: str | None = None) -> None:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = f"{settings.emails_from_name}<{settings.emails_from_email}>"
        msg["To"] = to_email
        msg.set_content(body_text)
        if body_html:
            msg.add_alternative(body_html, subtype="html")
        try:
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
                server.starttls()
                if settings.smtp_user and settings.smtp_password:
                    server.login(settings.smtp_user, settings.smtp_password)
                server.send_message(msg)
            logger.info(f"Email successfully sent to {to_email}")
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}:{e}")
            raise e

    async def send_otp_email(self, *, email:str, otp:str) -> None:
        subject = f"Your password reset code - {settings.app_name}"
        text_content = f"""
        Hi, 
        You requested a password reset for your {settings.app_name}account
        your One time password(OTP) is: {otp}
        This code will expire in {settings.otp_expiry_seconds // 60} minutes
        If you did not request this, please ignore this email
        """

        html_content = f"""
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #2563eb;">{settings.app_name} Password Reset</h2>
                <p>You requested a password reset. Use the OTP code below to continue:</p>
                <div style="background: #f3f4f6; padding: 15px; text-align: center; border-radius: 6px; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1e40af;">
                {otp}
                </div>
                <p>This code will expire in <strong>{settings.otp_expiry_seconds // 60} minutes</strong>.</p>
                <p style="font-size: 12px; color: #6b7280;">If you did not request a password reset, you can safely ignore this email.</p>
            </div>
            </body>
            </html>
            """
        self._send_smtp_email(
            to_email = email,
            subject=subject,
            body_text=text_content,
            body_html=html_content
            )
        


    async def send_ticket_created_email(self, *, ticket_id: str) -> None:
        ticket_repo = TicketRepository(self.session)
        ticket = await ticket_repo.get_by_id(ticket_id=UUID(ticket_id))
        if not ticket:
            return
        settings_service = OrganizationSettingsService(self.session)
        settings = await settings_service.get_or_create_settings(
            organization_id=ticket.organization_id
        )
        to_email = settings.support_email or "admin@yourdomain.com"
        subject = f"URGENT: New Support Ticket Escalated (#{str(ticket.id)[:8]})"
        text_content = f"An urgent ticket has been escalated by the AI.\nSubject: {ticket.subject}\nConversation ID: {ticket.conversation_id}"
        
        self._send_smtp_email(
            to_email=to_email,
            subject=subject,
            body_text=text_content
        )


    async def send_org_invitation_email(self, *, email: str, org_name: str, role: str) -> None:
        subject = f"You've been added to {org_name} on {settings.app_name}"
        text_content = f"Hi,\n\nYou have been added to the organization '{org_name}' with the role of {role}.\nLog in to your dashboard to view your new workspace!"
        
        self._send_smtp_email(
            to_email=email,
            subject=subject,
            body_text=text_content
        )

