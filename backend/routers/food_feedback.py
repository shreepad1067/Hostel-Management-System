from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from dependencies import require_roles

from models.food_feedback import (
    FoodFeedback,
)

from models.meal_confirmation import (
    MealConfirmation,
)

from models.student import Student
from models.user import User

from schemas.food_feedback import (
    FoodFeedbackCreate,
    FoodFeedbackResponse,
    FoodFeedbackSummary,
)


router = APIRouter(
    prefix="/food-feedback",
    tags=["Food Feedback"],
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


def get_student_for_user(
    db: Session,
    user: User,
) -> Student:
    student = (
        db.query(Student)
        .filter(
            Student.user_id
            == user.id
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


@router.post(
    "/",
    response_model=FoodFeedbackResponse,
    status_code=201,
)
def submit_feedback(
    payload: FoodFeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Student")
    ),
):
    student = get_student_for_user(
        db,
        current_user,
    )

    meal_type = (
        payload.meal_type
        .strip()
        .title()
    )

    if meal_type not in ALLOWED_MEALS:
        raise HTTPException(
            status_code=400,
            detail="Invalid meal type.",
        )

    today = datetime.now(
        INDIA_TIMEZONE
    ).date()

    if payload.meal_date > today:
        raise HTTPException(
            status_code=400,
            detail=(
                "Feedback cannot be submitted "
                "for a future meal."
            ),
        )

    collected = (
        db.query(MealConfirmation)
        .filter(
            MealConfirmation.student_id
            == student.id,

            MealConfirmation.meal_date
            == payload.meal_date,

            MealConfirmation.meal_type
            == meal_type,
        )
        .first()
    )

    if collected is None:
        raise HTTPException(
            status_code=400,
            detail=(
                "You can submit feedback only "
                "for a meal you collected."
            ),
        )

    feedback = FoodFeedback(
        student_id=student.id,
        meal_date=payload.meal_date,
        meal_type=meal_type,
        taste_rating=payload.taste_rating,
        quality_rating=payload.quality_rating,
        quantity_rating=payload.quantity_rating,
        hygiene_rating=payload.hygiene_rating,
        comment=(
            payload.comment.strip()
            if payload.comment
            else None
        ),
    )

    db.add(feedback)

    try:
        db.commit()

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail=(
                "You already submitted feedback "
                "for this meal."
            ),
        )

    db.refresh(feedback)

    return feedback


@router.get(
    "/my-feedback",
    response_model=list[
        FoodFeedbackResponse
    ],
)
def my_feedback(
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
        db.query(FoodFeedback)
        .filter(
            FoodFeedback.student_id
            == student.id
        )
        .order_by(
            FoodFeedback.meal_date.desc(),
            FoodFeedback.id.desc(),
        )
        .all()
    )


@router.get(
    "/records"
)
def feedback_records(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "Admin",
            "Warden",
        )
    ),
):
    rows = (
        db.query(
            FoodFeedback,
            Student,
        )
        .join(
            Student,
            Student.id
            == FoodFeedback.student_id,
        )
        .order_by(
            FoodFeedback.id.desc()
        )
        .all()
    )

    return [
        {
            "id":
                feedback.id,

            "student_id":
                student.id,

            "student_code":
                student.student_code,

            "student_name":
                student.name,

            "meal_date":
                feedback.meal_date,

            "meal_type":
                feedback.meal_type,

            "taste_rating":
                feedback.taste_rating,

            "quality_rating":
                feedback.quality_rating,

            "quantity_rating":
                feedback.quantity_rating,

            "hygiene_rating":
                feedback.hygiene_rating,

            "comment":
                feedback.comment,

            "created_at":
                feedback.created_at,
        }

        for (
            feedback,
            student,
        )
        in rows
    ]


@router.get(
    "/summary",
    response_model=list[
        FoodFeedbackSummary
    ],
)
def feedback_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "Admin",
            "Warden",
        )
    ),
):
    rows = (
        db.query(
            FoodFeedback.meal_type,

            func.count(
                FoodFeedback.id
            ),

            func.avg(
                FoodFeedback.taste_rating
            ),

            func.avg(
                FoodFeedback.quality_rating
            ),

            func.avg(
                FoodFeedback.quantity_rating
            ),

            func.avg(
                FoodFeedback.hygiene_rating
            ),
        )
        .group_by(
            FoodFeedback.meal_type
        )
        .all()
    )

    result = []

    for (
        meal_type,
        responses,
        taste,
        quality,
        quantity,
        hygiene,
    ) in rows:
        scores = [
            float(taste or 0),
            float(quality or 0),
            float(quantity or 0),
            float(hygiene or 0),
        ]

        result.append(
            {
                "meal_type":
                    meal_type,

                "responses":
                    int(responses),

                "taste":
                    round(
                        scores[0],
                        2,
                    ),

                "quality":
                    round(
                        scores[1],
                        2,
                    ),

                "quantity":
                    round(
                        scores[2],
                        2,
                    ),

                "hygiene":
                    round(
                        scores[3],
                        2,
                    ),

                "overall":
                    round(
                        sum(scores) / 4,
                        2,
                    ),
            }
        )

    return result