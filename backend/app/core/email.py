import logging
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from pathlib import Path

from .config import settings

logger = logging.getLogger(__name__)


async def send_report_email(to_email: str, candidate_name: str, job_title: str, report_path: Path):
    """
    Sends the interview evaluation report as an email attachment using stdlib smtplib.
    Works with any Gmail App Password configured in .env
    """
    if not settings.smtp_email or not settings.smtp_password:
        logger.warning("SMTP not configured. Skipping email to %s", to_email)
        return

    subject = f"Your Career Connect AI Interview Report — {job_title}"

    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #0d1117;">Hi {candidate_name},</h2>
        <p style="color: #334155; font-size: 16px;">
            Thank you for completing your AI interview for the <strong>{job_title}</strong> role on Career Connect AI.
        </p>
        <p style="color: #334155; font-size: 16px;">
            Your comprehensive evaluation report — including semantic accuracy, emotional intelligence analysis,
            communication clarity, and JD alignment — is attached to this email as a PDF.
        </p>
        <p style="color: #334155; font-size: 16px;">
            You can also view your live scores and feedback on your <strong>Candidate Dashboard</strong> at any time.
        </p>
        <br/>
        <p style="color: #6b7280; font-size: 14px;">
            Best wishes,<br/>
            <strong>Career Connect AI Recruitment Team</strong>
        </p>
    </div>
    """

    try:
        msg = MIMEMultipart("mixed")
        msg["From"] = settings.smtp_email
        msg["To"] = to_email
        msg["Subject"] = subject

        msg.attach(MIMEText(html_body, "html"))

        # Attach PDF if it exists
        if report_path.exists():
            with open(report_path, "rb") as f:
                part = MIMEBase("application", "octet-stream")
                part.set_payload(f.read())
            encoders.encode_base64(part)
            part.add_header(
                "Content-Disposition",
                f"attachment; filename={report_path.name}",
            )
            msg.attach(part)

        context = ssl.create_default_context()
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.ehlo()
            server.starttls(context=context)
            server.login(settings.smtp_email, settings.smtp_password)
            server.sendmail(settings.smtp_email, to_email, msg.as_string())

        logger.info("Report email successfully sent to %s", to_email)
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to_email, e)
