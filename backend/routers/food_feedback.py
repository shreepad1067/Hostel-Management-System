from datetime import datetime
from pathlib import Path
from uuid import uuid4
from zoneinfo import ZoneInfo

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from fastapi.responses import FileResponse

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
async def submit_feedback(
    meal_date: str = Form(...),
    meal_type: str = Form(...),
    taste_rating: int = Form(...),
    quality_rating: int = Form(...),
    quantity_rating: int = Form(...),
    hygiene_rating: int = Form(...),
    comment: str = Form(""),
    photo: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Student")),
):
    student = get_student_for_user(db, current_user)
    meal_type = meal_type.strip().title()

    if meal_type not in ALLOWED_MEALS:
        raise HTTPException(status_code=400, detail="Invalid meal type.")

    try:
        parsed_date = datetime.strptime(meal_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid meal date.")

    if parsed_date > datetime.now(INDIA_TIMEZONE).date():
        raise HTTPException(status_code=400, detail="Future meal date is not allowed.")

    if any(rating < 1 or rating > 5 for rating in (
        taste_rating, quality_rating, quantity_rating, hygiene_rating
    )):
        raise HTTPException(status_code=400, detail="Ratings must be from 1 to 5.")

    if len(comment) > 1000:
        raise HTTPException(status_code=400, detail="Comment is too long.")

    collected = db.query(MealConfirmation).filter(
        MealConfirmation.student_id == student.id,
        MealConfirmation.meal_date == parsed_date,
        MealConfirmation.meal_type == meal_type,
    ).first()
    if collected is None:
        raise HTTPException(
            status_code=400,
            detail="You can submit feedback only for a meal you collected.",
        )

    image_filename = None
    image_path = None
    if photo is not None and photo.filename:
        allowed = {
            "image/jpeg": (".jpg", lambda b: b.startswith(b"\\xff\\xd8\\xff")),
            "image/png": (".png", lambda b: b.startswith(b"\\x89PNG\\r\\n\\x1a\\n")),
            "image/webp": (".webp", lambda b: b.startswith(b"RIFF") and b[8:12] == b"WEBP"),
        }
        image_type = allowed.get(photo.content_type or "")
        if image_type is None:
            raise HTTPException(status_code=400, detail="Use a JPEG, PNG, or WebP photo.")

        image_bytes = await photo.read(5 * 1024 * 1024 + 1)
        if len(image_bytes) > 5 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Photo must be 5 MB or smaller.")
        if not image_type[1](image_bytes):
            raise HTTPException(status_code=400, detail="The uploaded file is not a valid image.")

        upload_dir = Path(__file__).resolve().parents[1] / "uploads" / "food_feedback"
        upload_dir.mkdir(parents=True, exist_ok=True)
        image_filename = uuid4().hex + image_type[0]
        image_path = upload_dir / image_filename
        image_path.write_bytes(image_bytes)

    feedback = FoodFeedback(
        student_id=student.id,
        meal_date=parsed_date,
        meal_type=meal_type,
        taste_rating=taste_rating,
        quality_rating=quality_rating,
        quantity_rating=quantity_rating,
        hygiene_rating=hygiene_rating,
        comment=comment.strip() or None,
        image_filename=image_filename,
    )
    db.add(feedback)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        if image_path:
            image_path.unlink(missing_ok=True)
        raise HTTPException(status_code=409, detail="You already submitted feedback for this meal.")

    db.refresh(feedback)
    return feedback


@router.get("/{feedback_id}/photo")
def get_feedback_photo(
    feedback_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Student", "Admin", "Warden")),
):
    feedback = db.query(FoodFeedback).filter(
        FoodFeedback.id == feedback_id
    ).first()
    if feedback is None or not feedback.image_filename:
        raise HTTPException(status_code=404, detail="Feedback photo not found.")

    if current_user.role == "Student":
        student = get_student_for_user(db, current_user)
        if feedback.student_id != student.id:
            raise HTTPException(status_code=403, detail="Not allowed to view this photo.")

    photo_path = (
        Path(__file__).resolve().parents[1]
        / "uploads"
        / "food_feedback"
        / feedback.image_filename
    )
    if not photo_path.is_file():
        raise HTTPException(status_code=404, detail="Photo file is missing.")

    return FileResponse(photo_path)


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

            "photo_url":
                feedback.photo_url,

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