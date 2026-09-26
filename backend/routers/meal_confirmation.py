from datetime import date, datetime
from zoneinfo import ZoneInfo

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from dependencies import require_roles

from models.meal_confirmation import (
    MealConfirmation,
)
from models.student import Student
from models.user import User

from schemas.meal_confirmation import (
    MealConfirmationCreate,
    MealConfirmationResponse,
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


def get_today() -> date:
    return india_now().date()


def normalize_meal_type(
    meal_type: str,
) -> str:
    normalized = (
        meal_type
        .strip()
        .title()
    )

    if normalized not in ALLOWED_MEALS:
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=(
                "Invalid meal type. "
                "Choose Breakfast, Lunch, "
                "Snacks, or Dinner."
            ),
        )

    return normalized


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
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=(
                "No student record is linked "
                "to this user account."
            ),
        )

    return student


def notify_parent_about_meal(
    student: Student,
    meal_type: str,
    confirmed_at: datetime,
) -> bool:
    """
    Parent notification failure must not
    cancel the student's meal confirmation.
    """

    if not student.parent_email:
        return False

    try:
        india_time = confirmed_at

        if india_time.tzinfo is None:
            india_time = india_time.replace(
                tzinfo=INDIA_TIMEZONE
            )
        else:
            india_time = (
                india_time.astimezone(
                    INDIA_TIMEZONE
                )
            )

        send_parent_meal_notification(
            parent_email=(
                student.parent_email
            ),
            parent_name=(
                student.parent_name
            ),
            student_name=student.name,
            student_code=(
                student.student_code
            ),
            meal_type=meal_type,
            meal_date=(
                india_time
                .date()
                .strftime("%d-%m-%Y")
            ),
            confirmed_time=(
                india_time
                .strftime(
                    "%I:%M %p"
                )
            ),
        )

        return True

    except Exception as exc:
        print(
            "Meal parent notification "
            f"failed: {exc}"
        )

        return False


@router.post(
    "/confirm",
    response_model=(
        MealConfirmationResponse
    ),
    status_code=(
        status.HTTP_201_CREATED
    ),
)
def confirm_meal(
    payload: MealConfirmationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Student")
    ),
):
    student = get_student_for_user(
        db,
        current_user,
    )

    meal_type = normalize_meal_type(
        payload.meal_type
    )

    today = get_today()

    existing = (
        db.query(MealConfirmation)
        .filter(
            MealConfirmation.student_id
            == student.id,

            MealConfirmation.meal_date
            == today,

            MealConfirmation.meal_type
            == meal_type,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=(
                status.HTTP_409_CONFLICT
            ),
            detail=(
                f"{meal_type} has already "
                "been confirmed for today."
            ),
        )

    confirmation = MealConfirmation(
        student_id=student.id,
        meal_date=today,
        meal_type=meal_type,
        status="Confirmed",
    )

    db.add(confirmation)

    try:
        db.commit()

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=(
                status.HTTP_409_CONFLICT
            ),
            detail=(
                f"{meal_type} has already "
                "been confirmed for today."
            ),
        )

    db.refresh(confirmation)

    notify_parent_about_meal(
        student=student,
        meal_type=meal_type,
        confirmed_at=(
            confirmation.confirmed_at
        ),
    )

    return confirmation


@router.get(
    "/my-today",
    response_model=list[
        MealConfirmationResponse
    ],
)
def get_my_today_meals(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Student")
    ),
):
    student = get_student_for_user(
        db,
        current_user,
    )

    today = get_today()

    records = (
        db.query(MealConfirmation)
        .filter(
            MealConfirmation.student_id
            == student.id,

            MealConfirmation.meal_date
            == today,
        )
        .order_by(
            MealConfirmation
            .confirmed_at
            .asc()
        )
        .all()
    )

    return records


@router.get(
    "/my-history",
    response_model=list[
        MealConfirmationResponse
    ],
)
def get_my_meal_history(
    limit: int = Query(
        default=30,
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

    records = (
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

    return records


@router.get(
    "/records",
    response_model=list[
        MealRecordResponse
    ],
)
def get_meal_records(
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
        if meal_date is not None
        else get_today()
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
        normalized_meal = (
            normalize_meal_type(
                meal_type
            )
        )

        query = query.filter(
            MealConfirmation.meal_type
            == normalized_meal
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

            student_code=(
                student.student_code
            ),

            student_name=(
                student.name
            ),

            meal_date=(
                confirmation.meal_date
            ),

            meal_type=(
                confirmation.meal_type
            ),

            status=(
                confirmation.status
            ),

            confirmed_at=(
                confirmation.confirmed_at
            ),
        )
        for confirmation, student
        in rows
    ]