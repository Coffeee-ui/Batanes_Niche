import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailDeliveryService:
    @staticmethod
    def send_otp_email(to_email: str, otp_code: str) -> bool:
        """
        Dispatches a 6-digit password reset OTP email.
        Uses Gmail/SMTP if credentials are provided.
        Falls back to safe simulation logging in development if credentials are empty.
        """
        subject = f"[{settings.APP_NAME}] Your Password Reset Code"
        body_text = (
            f"Hello,\n\n"
            f"You requested a password reset for your {settings.APP_NAME} account.\n\n"
            f"Your 6-digit reset code is: {otp_code}\n\n"
            f"This code will expire in 15 minutes. If you did not request this, please ignore this email.\n\n"
            f"Sincerely,\n{settings.APP_NAME} Support Team"
        )

        # If SMTP username/password are not configured, simulate delivery for local development
        if not settings.MAIL_USERNAME or not settings.MAIL_PASSWORD:
            logger.info(
                f"[EMAIL_SIMULATION] Password reset OTP sent to {to_email}. OTP Code: {otp_code} (Simulation mode)"
            )
            return True

        try:
            msg = MIMEMultipart()
            msg["From"] = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>"
            msg["To"] = to_email
            msg["Subject"] = subject
            msg.attach(MIMEText(body_text, "plain"))

            if settings.MAIL_SSL_TLS:
                with smtplib.SMTP_SSL(settings.MAIL_HOST, settings.MAIL_PORT, timeout=10) as server:
                    server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
                    server.sendmail(settings.MAIL_FROM, [to_email], msg.as_string())
            else:
                with smtplib.SMTP(settings.MAIL_HOST, settings.MAIL_PORT, timeout=10) as server:
                    if settings.MAIL_STARTTLS:
                        server.starttls()
                    server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
                    server.sendmail(settings.MAIL_FROM, [to_email], msg.as_string())

            logger.info(f"Successfully sent OTP email to {to_email}")
            return True
        except Exception as exc:
            logger.error(f"Failed to dispatch OTP email to {to_email}: {exc}")
            # Do not crash calling code; return False
            return False
