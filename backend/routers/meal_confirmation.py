from datetime import (
    date,
    datetime,
    timedelta,
    timezone,
)

from zoneinfo import ZoneInfo

import jwt

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import (
    ALGORITHM,
    SECRET_KEY,
)

from database import get_db
from dependencies import require_roles

from models.meal_confirmation import (
    MealConfirmation,
    MealQRSession,
)

from models.student import Student
from models.user import User

from schemas.meal_confirmation import (
    MealConfirmationResponse,
    MealQRGenerateRequest,
    MealQRResponse,
    MealQRScanRequest,
    MealRecordResponse,
)

from services.notification_service import (
    send_parent_meal_notification,
)


router = APIRouter(
    prefix="/meals",
    tags=["Meal Tracking"],
)


INDIA_TIMEZONE = ZoneInfo(
    "Asia/Kolkata"
)


ALLOWED_MEALS = {
    "Breakfast",
    "Lunch",
    "Snacks",
    "Dinner",
}


def india_now() -> datetime:
    return datetime.now(
        INDIA_TIMEZONE
    )


def today_india() -> date:
    return india_now().date()


def utc_now_naive() -> datetime:
    return datetime.now(
        timezone.utc
    ).replace(
        tzinfo=None
    )


def normalize_meal_type(
    meal_type: str,
) -> str:
    value = (
        meal_type
        .strip()
        .title()
    )

    if value not in ALLOWED_MEALS:
        raise HTTPException(
            status_code=400,
            detail=(
                "Meal must be Breakfast, "
                "Lunch, Snacks, or Dinner."
            ),
        )

    return value


def get_student_for_user(
    db: Session,
    current_user: User,
) -> Student:
    student = (
        db.query(Student)
        .filter(
            Student.user_id
            == current_user.id
        )
        .first()
    )

    if student is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "No student profile is "
                "linked to this account."
            ),
        )

    return student


def notify_parent(
    student: Student,
    confirmation: MealConfirmation,
) -> None:
    if not student.parent_email:
        return

    try:
        confirmed_time = (
            confirmation.confirmed_at
        )

        if confirmed_time.tzinfo is None:
            confirmed_time = (
                confirmed_time.replace(
                    tzinfo=INDIA_TIMEZONE
                )
            )
        else:
            confirmed_time = (
                confirmed_time.astimezone(
                    INDIA_TIMEZONE
                )
            )

        send_parent_meal_notification(
            parent_email=student.parent_email,
            parent_name=student.parent_name,
            student_name=student.name,
            student_code=student.student_code,
            meal_type=confirmation.meal_type,
            meal_date=(
                confirmation.meal_date
                .strftime("%d-%m-%Y")
            ),
            confirmed_time=(
                confirmed_time
                .strftime("%I:%M %p")
            ),
        )

    except Exception as exc:
        print(
            "Parent meal notification failed: "
            f"{exc}"
        )


@router.post(
    "/qr/generate",
    response_model=MealQRResponse,
)
def generate_meal_qr(
    payload: MealQRGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Warden")
    ),
):
    meal_type = normalize_meal_type(
        payload.meal_type
    )

    today = today_india()

    active_sessions = (
        db.query(MealQRSession)
        .filter(
            MealQRSession.meal_date
            == today,

            MealQRSession.meal_type
            == meal_type,

            MealQRSession.is_active
            .is_(True),
        )
        .all()
    )

    for old_session in active_sessions:
        old_session.is_active = False

    expires_aware = (
        datetime.now(
            timezone.utc
        )
        + timedelta(
            seconds=payload.duration_seconds
        )
    )

    session = MealQRSession(
        meal_type=meal_type,
        meal_date=today,
        expires_at=(
            expires_aware.replace(
                tzinfo=None
            )
        ),
        created_by=current_user.id,
        is_active=True,
    )

    db.add(session)
    db.flush()

    qr_token = jwt.encode(
        {
            "type":
                "hostel_meal_qr",

            "session_id":
                session.id,

            "meal_type":
                meal_type,

            "meal_date":
                today.isoformat(),

            "exp":
                expires_aware,
        },
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    db.commit()
    db.refresh(session)

    return MealQRResponse(
        session_id=session.id,
        meal_type=session.meal_type,
        meal_date=session.meal_date,
        expires_at=session.expires_at,
        qr_token=qr_token,
    )


@router.post(
    "/scan",
    response_model=MealConfirmationResponse,
    status_code=status.HTTP_201_CREATED,
)
def scan_meal_qr(
    payload: MealQRScanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Student")
    ),
):
    student = get_student_for_user(
        db,
        current_user,
    )

    try:
        token_data = jwt.decode(
            payload.qr_token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=400,
            detail=(
                "This QR code has expired."
            ),
        )

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=400,
            detail="Invalid meal QR code.",
        )

    if (
        token_data.get("type")
        != "hostel_meal_qr"
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid meal QR code.",
        )

    session_id = token_data.get(
        "session_id"
    )

    if session_id is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid meal QR code.",
        )

    session = (
        db.query(MealQRSession)
        .filter(
            MealQRSession.id
            == int(session_id)
        )
        .first()
    )

    if session is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "Meal QR session not found."
            ),
        )

    if not session.is_active:
        raise HTTPException(
            status_code=400,
            detail=(
                "This meal QR is no longer active."
            ),
        )

    if (
        session.expires_at
        <= utc_now_naive()
    ):
        session.is_active = False

        db.commit()

        raise HTTPException(
            status_code=400,
            detail=(
                "This meal QR has expired."
            ),
        )

    today = today_india()

    if session.meal_date != today:
        raise HTTPException(
            status_code=400,
            detail=(
                "This meal QR is not valid today."
            ),
        )

    existing = (
        db.query(MealConfirmation)
        .filter(
            MealConfirmation.student_id
            == student.id,

            MealConfirmation.meal_date
            == today,

            MealConfirmation.meal_type
            == session.meal_type,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail=(
                f"{session.meal_type} has already "
                "been collected today."
            ),
        )

    confirmation = MealConfirmation(
        student_id=student.id,
        meal_date=today,
        meal_type=session.meal_type,
        status="Collected",
    )

    db.add(confirmation)

    try:
        db.commit()

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail=(
                "This meal was already collected."
            ),
        )

    db.refresh(confirmation)

    notify_parent(
        student,
        confirmation,
    )

    return confirmation


@router.get(
    "/my-today",
    response_model=list[
        MealConfirmationResponse
    ],
)
def my_meals_today(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Student")
    ),
):
    student = get_student_for_user(
        db,
        current_user,
    )

    return (
        db.query(MealConfirmation)
        .filter(
            MealConfirmation.student_id
            == student.id,

            MealConfirmation.meal_date
            == today_india(),
        )
        .order_by(
            MealConfirmation
            .confirmed_at
            .asc()
        )
        .all()
    )


@router.get(
    "/my-history",
    response_model=list[
        MealConfirmationResponse
    ],
)
def my_meal_history(
    limit: int = Query(
        default=50,
        ge=1,
        le=200,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Student")
    ),
):
    student = get_student_for_user(
        db,
        current_user,
    )

    return (
        db.query(MealConfirmation)
        .filter(
            MealConfirmation.student_id
            == student.id
        )
        .order_by(
            MealConfirmation
            .meal_date
            .desc(),

            MealConfirmation
            .confirmed_at
            .desc(),
        )
        .limit(limit)
        .all()
    )


@router.get(
    "/records",
    response_model=list[
        MealRecordResponse
    ],
)
def meal_records(
    meal_date: date | None = Query(
        default=None
    ),

    meal_type: str | None = Query(
        default=None
    ),

    db: Session = Depends(get_db),

    current_user: User = Depends(
        require_roles(
            "Admin",
            "Warden",
        )
    ),
):
    target_date = (
        meal_date
        or today_india()
    )

    query = (
        db.query(
            MealConfirmation,
            Student,
        )
        .join(
            Student,
            Student.id
            == MealConfirmation.student_id,
        )
        .filter(
            MealConfirmation.meal_date
            == target_date
        )
    )

    if meal_type:
        query = query.filter(
            MealConfirmation.meal_type
            == normalize_meal_type(
                meal_type
            )
        )

    rows = (
        query
        .order_by(
            MealConfirmation
            .confirmed_at
            .desc()
        )
        .all()
    )

    return [
        MealRecordResponse(
            id=confirmation.id,
            student_id=student.id,
            student_code=student.student_code,
            student_name=student.name,
            meal_date=confirmation.meal_date,
            meal_type=confirmation.meal_type,
            status=confirmation.status,
            confirmed_at=confirmation.confirmed_at,
        )

        for (
            confirmation,
            student,
        )
        in rows
    ]