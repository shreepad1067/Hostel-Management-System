from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy.orm import Session

from database import get_db
from dependencies import require_roles

from models.student import Student
from models.user import User

from models.website_feedback import (
    WebsiteFeedback,
)

from schemas.website_feedback import (
    WebsiteFeedbackCreate,
    WebsiteFeedbackResponse,
    WebsiteFeedbackUpdate,
)


router = APIRouter(
    prefix="/website-feedback",
    tags=["Website Feedback"],
)


CATEGORIES = {
    "Suggestion",
    "Bug",
    "Design",
    "Performance",
    "Other",
}


STATUSES = {
    "New",
    "Reviewed",
    "Planned",
    "Resolved",
}


def student_for_user(
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
    response_model=WebsiteFeedbackResponse,
    status_code=201,
)
def submit_feedback(
    payload: WebsiteFeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Student")
    ),
):
    student = student_for_user(
        db,
        current_user,
    )

    category = (
        payload.category
        .strip()
        .title()
    )

    if category not in CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid feedback category."
            ),
        )

    record = WebsiteFeedback(
        student_id=student.id,
        category=category,
        rating=payload.rating,
        message=payload.message.strip(),
        status="New",
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return record


@router.get(
    "/my-feedback",
    response_model=list[
        WebsiteFeedbackResponse
    ],
)
def my_feedback(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Student")
    ),
):
    student = student_for_user(
        db,
        current_user,
    )

    return (
        db.query(WebsiteFeedback)
        .filter(
            WebsiteFeedback.student_id
            == student.id
        )
        .order_by(
            WebsiteFeedback.id.desc()
        )
        .all()
    )


@router.get(
    "/records"
)
def feedback_records(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin")
    ),
):
    rows = (
        db.query(
            WebsiteFeedback,
            Student,
        )
        .join(
            Student,
            Student.id
            == WebsiteFeedback.student_id,
        )
        .order_by(
            WebsiteFeedback.id.desc()
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

            "category":
                feedback.category,

            "rating":
                feedback.rating,

            "message":
                feedback.message,

            "status":
                feedback.status,

            "admin_note":
                feedback.admin_note,

            "created_at":
                feedback.created_at,

            "updated_at":
                feedback.updated_at,
        }

        for (
            feedback,
            student,
        )
        in rows
    ]


@router.put(
    "/{feedback_id}",
    response_model=WebsiteFeedbackResponse,
)
def update_feedback(
    feedback_id: int,
    payload: WebsiteFeedbackUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin")
    ),
):
    status_value = (
        payload.status.strip()
    )

    if status_value not in STATUSES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid feedback status."
            ),
        )

    record = (
        db.query(WebsiteFeedback)
        .filter(
            WebsiteFeedback.id
            == feedback_id
        )
        .first()
    )

    if record is None:
        raise HTTPException(
            status_code=404,
            detail="Feedback not found.",
        )

    record.status = status_value

    record.admin_note = (
        payload.admin_note.strip()
        if payload.admin_note
        else None
    )

    db.commit()
    db.refresh(record)

    return record