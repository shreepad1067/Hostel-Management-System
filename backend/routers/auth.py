from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy.orm import Session

from database import get_db

from models.user import User

from models.password_reset_otp import (
    PasswordResetOTP,
)

from schemas.user import (
    UserCreate,
    UserLogin,
    ForgotPasswordRequest,
    VerifyOTPRequest,
    ResetPasswordRequest,
    UserResponse,
    TokenResponse,
)

from auth import (
    hash_password,
    verify_password,
    create_access_token,
)

from services.otp_service import (
    generate_otp,
    hash_otp,
    verify_otp,
    get_otp_expiry,
    utc_now,
    MAX_OTP_ATTEMPTS,
)

from services.notification_service import (
    send_password_reset_otp,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


def find_user_by_identifier(
    db: Session,
    identifier: str,
):
    normalized = (
        identifier
        .strip()
    )

    user = (
        db.query(User)
        .filter(
            User.email
            == normalized.lower()
        )
        .first()
    )

    if user:
        return user

    return (
        db.query(User)
        .filter(
            User.phone_number
            == normalized
        )
        .first()
    )


# =========================================================
# PUBLIC REGISTRATION
# =========================================================

@router.post(
    "/register",
    response_model=UserResponse,
)
def register_user(
    user_data: UserCreate,
):
    """
    Public signup is intentionally disabled.

    Student and Warden accounts must be
    provisioned by the Admin through the
    Account Management module.
    """

    raise HTTPException(
        status_code=403,
        detail=(
            "Public registration is disabled. "
            "Student and Warden accounts must "
            "be created by the hostel Admin."
        ),
    )


# =========================================================
# FORGOT PASSWORD
# =========================================================

@router.post(
    "/forgot-password"
)
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    identifier = (
        request.identifier
        .strip()
    )

    user = find_user_by_identifier(
        db,
        identifier,
    )

    generic_message = (
        "If the account exists, an OTP has "
        "been sent to the registered "
        "contact details."
    )

    if (
        not user
        or not user.is_active
    ):
        return {
            "message":
                generic_message
        }


    old_otps = (
        db.query(
            PasswordResetOTP
        )
        .filter(
            PasswordResetOTP.user_id
            == user.id,

            PasswordResetOTP.is_used
            == False,
        )
        .all()
    )


    for old_otp in old_otps:
        old_otp.is_used = True


    plain_otp = generate_otp()


    otp_record = PasswordResetOTP(
        user_id=user.id,

        otp_hash=hash_otp(
            plain_otp
        ),

        expires_at=(
            get_otp_expiry()
        ),

        is_used=False,

        attempts=0,
    )


    db.add(
        otp_record
    )


    try:
        db.commit()

        db.refresh(
            otp_record
        )

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to create password "
                "reset request"
            ),
        )


    try:
        delivery = (
            send_password_reset_otp(
                email=user.email,

                phone_number=(
                    user.phone_number
                ),

                otp=plain_otp,
            )
        )

    except Exception as exc:
        otp_record.is_used = True

        db.commit()

        print(
            "OTP delivery error:",
            exc,
        )

        raise HTTPException(
            status_code=503,
            detail=(
                "Unable to send OTP. "
                "Please try again later."
            ),
        )


    return {
        "message": (
            "OTP sent successfully to your "
            "registered contact details."
        ),

        "email_sent":
            delivery["email_sent"],

        "sms_sent":
            delivery["sms_sent"],
    }


# =========================================================
# VERIFY OTP
# =========================================================

@router.post(
    "/verify-otp"
)
def verify_password_reset_otp(
    request: VerifyOTPRequest,
    db: Session = Depends(get_db),
):
    identifier = (
        request.identifier
        .strip()
    )

    entered_otp = (
        request.otp
        .strip()
    )


    user = find_user_by_identifier(
        db,
        identifier,
    )


    if not user:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid or expired OTP"
            ),
        )


    otp_record = (
        db.query(
            PasswordResetOTP
        )
        .filter(
            PasswordResetOTP.user_id
            == user.id,

            PasswordResetOTP.is_used
            == False,
        )
        .order_by(
            PasswordResetOTP
            .id
            .desc()
        )
        .first()
    )


    if not otp_record:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid or expired OTP"
            ),
        )


    if (
        otp_record.expires_at
        < utc_now()
    ):
        otp_record.is_used = True

        db.commit()

        raise HTTPException(
            status_code=400,
            detail="OTP has expired",
        )


    if (
        otp_record.attempts
        >= MAX_OTP_ATTEMPTS
    ):
        otp_record.is_used = True

        db.commit()

        raise HTTPException(
            status_code=400,
            detail=(
                "Too many incorrect OTP "
                "attempts. Request a new OTP."
            ),
        )


    if not verify_otp(
        entered_otp,
        otp_record.otp_hash,
    ):
        otp_record.attempts += 1


        if (
            otp_record.attempts
            >= MAX_OTP_ATTEMPTS
        ):
            otp_record.is_used = True


        db.commit()


        remaining_attempts = (
            MAX_OTP_ATTEMPTS
            - otp_record.attempts
        )


        if (
            remaining_attempts
            <= 0
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "Too many incorrect OTP "
                    "attempts. Request a new OTP."
                ),
            )


        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid OTP. "
                f"{remaining_attempts} "
                "attempt(s) remaining."
            ),
        )


    otp_record.verified_at = (
        utc_now()
    )

    db.commit()


    return {
        "message":
            "OTP verified successfully"
    }


# =========================================================
# RESET PASSWORD
# =========================================================

@router.post(
    "/reset-password"
)
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    identifier = (
        request.identifier
        .strip()
    )

    entered_otp = (
        request.otp
        .strip()
    )


    if (
        len(
            request.new_password
        )
        < 8
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "New password must contain "
                "at least 8 characters"
            ),
        )


    user = find_user_by_identifier(
        db,
        identifier,
    )


    if not user:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid or expired password "
                "reset request"
            ),
        )


    otp_record = (
        db.query(
            PasswordResetOTP
        )
        .filter(
            PasswordResetOTP.user_id
            == user.id,

            PasswordResetOTP.is_used
            == False,
        )
        .order_by(
            PasswordResetOTP
            .id
            .desc()
        )
        .first()
    )


    if not otp_record:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid or expired password "
                "reset request"
            ),
        )


    if (
        otp_record.expires_at
        < utc_now()
    ):
        otp_record.is_used = True

        db.commit()

        raise HTTPException(
            status_code=400,
            detail="OTP has expired",
        )


    if (
        otp_record.verified_at
        is None
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "OTP must be verified "
                "before resetting the password"
            ),
        )


    if not verify_otp(
        entered_otp,
        otp_record.otp_hash,
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid or expired password "
                "reset request"
            ),
        )


    if verify_password(
        request.new_password,
        user.hashed_password,
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "New password must be different "
                "from the current password"
            ),
        )


    user.hashed_password = (
        hash_password(
            request.new_password
        )
    )


    # OTP becomes permanently unusable
    otp_record.is_used = True


    try:
        db.commit()

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to reset password"
            ),
        )


    return {
        "message":
            "Password reset successfully"
    }


# =========================================================
# LOGIN
# =========================================================

@router.post(
    "/login",
    response_model=TokenResponse,
)
def login_user(
    user_data: UserLogin,
    db: Session = Depends(get_db),
):
    username = (
        user_data.username
        .strip()
    )


    user = (
        db.query(User)
        .filter(
            User.username
            == username
        )
        .first()
    )


    if not user:
        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid username or password"
            ),
        )


    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail=(
                "User account is inactive"
            ),
        )


    if not verify_password(
        user_data.password,
        user.hashed_password,
    ):
        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid username or password"
            ),
        )


    access_token = (
        create_access_token(
            {
                "sub":
                    str(user.id),

                "username":
                    user.username,

                "role":
                    user.role,
            }
        )
    )


    return {
        "access_token":
            access_token,

        "token_type":
            "bearer",
    }