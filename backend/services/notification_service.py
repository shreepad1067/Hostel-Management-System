import os
import smtplib

from email.message import EmailMessage

from dotenv import load_dotenv
from twilio.rest import Client


load_dotenv()


SMTP_HOST = os.getenv(
    "SMTP_HOST",
    "smtp.gmail.com",
)

SMTP_PORT = int(
    os.getenv(
        "SMTP_PORT",
        "587",
    )
)

SMTP_EMAIL = os.getenv(
    "SMTP_EMAIL"
)

SMTP_APP_PASSWORD = os.getenv(
    "SMTP_APP_PASSWORD"
)


TWILIO_ACCOUNT_SID = os.getenv(
    "TWILIO_ACCOUNT_SID"
)

TWILIO_AUTH_TOKEN = os.getenv(
    "TWILIO_AUTH_TOKEN"
)

TWILIO_PHONE_NUMBER = os.getenv(
    "TWILIO_PHONE_NUMBER"
)


def normalize_phone_number(
    phone_number: str,
) -> str:

    phone = (
        phone_number
        .strip()
        .replace(" ", "")
        .replace("-", "")
    )

    if phone.startswith("+"):
        return phone

    if (
        phone.startswith("91")
        and len(phone) == 12
    ):
        return f"+{phone}"

    if (
        len(phone) == 10
        and phone.isdigit()
    ):
        return f"+91{phone}"

    return phone


def send_email(
    recipient_email: str,
    subject: str,
    body: str,
) -> None:

    if not SMTP_EMAIL:
        raise RuntimeError(
            "SMTP_EMAIL is not configured"
        )

    if not SMTP_APP_PASSWORD:
        raise RuntimeError(
            "SMTP_APP_PASSWORD is not configured"
        )

    message = EmailMessage()

    message["Subject"] = subject
    message["From"] = SMTP_EMAIL
    message["To"] = recipient_email

    message.set_content(body)

    with smtplib.SMTP(
        SMTP_HOST,
        SMTP_PORT,
        timeout=20,
    ) as server:

        server.ehlo()
        server.starttls()
        server.ehlo()

        server.login(
            SMTP_EMAIL,
            SMTP_APP_PASSWORD,
        )

        server.send_message(
            message
        )


def send_email_otp(
    recipient_email: str,
    otp: str,
) -> None:

    send_email(
        recipient_email,
        "HostelHub Password Reset OTP",
        f"""
Hello,

Your HostelHub password reset OTP is:

{otp}

This OTP will expire in 5 minutes.

Do not share this OTP with anyone.

If you did not request a password reset,
you can ignore this message.

HostelHub
Management System
""",
    )


def send_sms_otp(
    phone_number: str,
    otp: str,
) -> None:

    if not TWILIO_ACCOUNT_SID:
        raise RuntimeError(
            "TWILIO_ACCOUNT_SID is not configured"
        )

    if not TWILIO_AUTH_TOKEN:
        raise RuntimeError(
            "TWILIO_AUTH_TOKEN is not configured"
        )

    if not TWILIO_PHONE_NUMBER:
        raise RuntimeError(
            "TWILIO_PHONE_NUMBER is not configured"
        )

    recipient = normalize_phone_number(
        phone_number
    )

    client = Client(
        TWILIO_ACCOUNT_SID,
        TWILIO_AUTH_TOKEN,
    )

    client.messages.create(
        body=(
            "HostelHub password reset OTP: "
            f"{otp}. "
            "Valid for 5 minutes. "
            "Do not share this OTP."
        ),
        from_=TWILIO_PHONE_NUMBER,
        to=recipient,
    )


def send_password_reset_otp(
    email: str | None,
    phone_number: str | None,
    otp: str,
) -> dict:

    email_sent = False
    sms_sent = False

    email_error = None
    sms_error = None

    if email:
        try:
            send_email_otp(
                email,
                otp,
            )

            email_sent = True

        except Exception as exc:
            email_error = str(exc)

    if phone_number:
        try:
            send_sms_otp(
                phone_number,
                otp,
            )

            sms_sent = True

        except Exception as exc:
            sms_error = str(exc)

    if (
        not email_sent
        and not sms_sent
    ):
        raise RuntimeError(
            "OTP delivery failed through "
            "both email and SMS. "
            f"Email error: {email_error}. "
            f"SMS error: {sms_error}."
        )

    return {
        "email_sent": email_sent,
        "sms_sent": sms_sent,
    }


def send_parent_meal_notification(
    parent_email: str,
    parent_name: str | None,
    student_name: str,
    student_code: str | None,
    meal_type: str,
    meal_date: str,
    confirmed_time: str,
) -> None:

    parent_display_name = (
        parent_name.strip()
        if parent_name
        and parent_name.strip()
        else "Parent/Guardian"
    )

    student_id = (
        student_code
        or "Not available"
    )

    send_email(
        parent_email,

        (
            "HostelHub Meal Confirmation - "
            f"{student_name}"
        ),

        f"""
Hello {parent_display_name},

This is an automated update from HostelHub.

Student:
{student_name}

HostelHub Student ID:
{student_id}

Meal:
{meal_type}

Date:
{meal_date}

Confirmed at:
{confirmed_time}

The student has confirmed that they
received the above hostel meal.

Regards,
HostelHub
Hostel Management System
""",
    )


def send_parent_sos_notification(
    parent_email: str,
    parent_name: str | None,
    student_name: str,
    student_code: str | None,
    category: str,
    location: str | None,
    verified_time: str,
    verification_note: str | None,
) -> None:

    parent_display_name = (
        parent_name.strip()
        if parent_name
        and parent_name.strip()
        else "Parent/Guardian"
    )

    student_id = (
        student_code
        or "Not available"
    )

    location_text = (
        location
        or "Location not specified"
    )

    note_text = (
        verification_note
        or "No additional note."
    )

    send_email(
        parent_email,

        (
            "URGENT: HostelHub Emergency "
            f"Alert - {student_name}"
        ),

        f"""
Hello {parent_display_name},

This is an emergency notification
from HostelHub.

A hostel emergency alert raised by
the following student has been
verified as GENUINE by the Warden.

Student:
{student_name}

HostelHub Student ID:
{student_id}

Emergency Type:
{category}

Location:
{location_text}

Verified At:
{verified_time}

Warden Note:
{note_text}

Please contact the hostel administration
if further information is required.

Regards,
HostelHub
Hostel Management System
""",
    )