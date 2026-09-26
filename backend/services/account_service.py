import secrets
import string

from services.notification_service import (
    send_email,
)


PASSWORD_LENGTH = 16


def generate_temporary_password() -> str:
    """
    Generate a strong temporary password.

    Guarantees at least:
    - one uppercase letter
    - one lowercase letter
    - one digit
    - one symbol
    """

    uppercase = secrets.choice(
        string.ascii_uppercase
    )

    lowercase = secrets.choice(
        string.ascii_lowercase
    )

    digit = secrets.choice(
        string.digits
    )

    symbol = secrets.choice(
        "!@#$%&*?"
    )

    all_characters = (
        string.ascii_letters
        + string.digits
        + "!@#$%&*?"
    )

    remaining = [
        secrets.choice(
            all_characters
        )
        for _ in range(
            PASSWORD_LENGTH - 4
        )
    ]

    characters = [
        uppercase,
        lowercase,
        digit,
        symbol,
        *remaining,
    ]

    secrets.SystemRandom().shuffle(
        characters
    )

    return "".join(
        characters
    )


def send_account_credentials_email(
    recipient_email: str,
    recipient_name: str,
    username: str,
    temporary_password: str,
    role: str,
) -> None:
    subject = (
        "Your HostelHub Account "
        "Has Been Created"
    )

    body = f"""
Hello {recipient_name},

Your HostelHub account has been created
by the hostel administration.

Account Type:
{role}

Username:
{username}

Temporary Password:
{temporary_password}

Please keep these credentials private.

For security, after accessing your
account, use the Forgot Password option
on the HostelHub login page to set your
own password.

Never share your password or OTP with
anyone.

If you were not expecting this account,
please contact the hostel administration.

Regards,
HostelHub
Hostel Management System
"""

    send_email(
        recipient_email,
        subject,
        body,
    )