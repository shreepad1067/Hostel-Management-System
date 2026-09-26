from datetime import datetime, timedelta, timezone
import hashlib
import hmac
import os
import secrets

from dotenv import load_dotenv


load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY is not set in the .env file"
    )


OTP_LENGTH = 6
OTP_EXPIRE_MINUTES = 5
MAX_OTP_ATTEMPTS = 5


def generate_otp() -> str:
    """
    Generate a cryptographically secure 6-digit OTP.
    """
    minimum = 10 ** (OTP_LENGTH - 1)
    maximum = (10 ** OTP_LENGTH) - 1

    return str(
        secrets.randbelow(
            maximum - minimum + 1
        ) + minimum
    )


def hash_otp(otp: str) -> str:
    """
    Store only a secure HMAC hash of the OTP.
    The plain OTP is never stored in MySQL.
    """
    return hmac.new(
        SECRET_KEY.encode("utf-8"),
        otp.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()


def verify_otp(
    plain_otp: str,
    stored_hash: str
) -> bool:
    """
    Safely compare the entered OTP with
    the OTP hash stored in the database.
    """
    calculated_hash = hash_otp(plain_otp)

    return hmac.compare_digest(
        calculated_hash,
        stored_hash
    )


def get_otp_expiry() -> datetime:
    """
    OTP remains valid for 5 minutes.

    MySQL DATETIME is stored without timezone,
    so UTC is converted to a naive datetime.
    """
    return (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=OTP_EXPIRE_MINUTES
        )
    ).replace(tzinfo=None)


def utc_now() -> datetime:
    """
    Current UTC time in MySQL DATETIME format.
    """
    return datetime.now(
        timezone.utc
    ).replace(tzinfo=None)