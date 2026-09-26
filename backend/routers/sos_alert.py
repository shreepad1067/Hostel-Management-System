from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)

from sqlalchemy import case
from sqlalchemy.orm import Session

from database import get_db
from dependencies import require_roles

from models.sos_alert import (
    SOSAlert,
    SOSAlertLog,
)

from models.student import Student
from models.user import User

from schemas.sos_alert import (
    SOSAlertCreate,
    SOSAlertVerify,
    SOSAlertResponse,
    SOSAlertLogResponse,
)

from services.notification_service import (
    send_parent_sos_notification,
)


router = APIRouter(
    prefix="/sos",
    tags=["SOS / Emergency"],
)


INDIA_TIMEZONE = ZoneInfo(
    "Asia/Kolkata"
)


CATEGORY_MAP = {
    "medical emergency":
        "Medical Emergency",

    "ragging / harassment":
        "Ragging / Harassment",

    "ragging/harassment":
        "Ragging / Harassment",

    "safety issue":
        "Safety Issue",

    "other":
        "Other",
}


ALLOWED_STATUSES = {
    "Pending",
    "Genuine",
    "False",
}


def india_now_naive() -> datetime:
    return datetime.now(
        INDIA_TIMEZONE
    ).replace(
        tzinfo=None
    )


def normalize_category(
    category: str,
) -> str:
    value = (
        category
        .strip()
        .lower()
    )

    normalized = CATEGORY_MAP.get(
        value
    )

    if normalized is None:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid emergency category. "
                "Choose Medical Emergency, "
                "Ragging / Harassment, "
                "Safety Issue, or Other."
            ),
        )

    return normalized


def validate_description(
    description: str,
) -> str:
    value = description.strip()

    if not value:
        raise HTTPException(
            status_code=400,
            detail=(
                "Emergency description "
                "cannot be empty."
            ),
        )

    if len(value) > 500:
        raise HTTPException(
            status_code=400,
            detail=(
                "Emergency description "
                "cannot exceed 500 characters."
            ),
        )

    return value


def normalize_location(
    location: str | None,
) -> str | None:
    if location is None:
        return None

    value = location.strip()

    if not value:
        return None

    if len(value) > 255:
        raise HTTPException(
            status_code=400,
            detail=(
                "Location cannot exceed "
                "255 characters."
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
                "No student record is linked "
                "to this account."
            ),
        )

    return student


def build_alert_response(
    alert: SOSAlert,
    student: Student,
) -> SOSAlertResponse:
    return SOSAlertResponse(
        id=alert.id,

        student_id=student.id,

        student_code=(
            student.student_code
        ),

        student_name=student.name,

        category=alert.category,

        description=(
            alert.description
        ),

        location=alert.location,

        status=alert.status,

        created_at=(
            alert.created_at
        ),

        verified_by=(
            alert.verified_by
        ),

        verified_at=(
            alert.verified_at
        ),

        verification_note=(
            alert.verification_note
        ),

        parent_notified=(
            alert.parent_notified
        ),

        parent_notified_at=(
            alert.parent_notified_at
        ),
    )


@router.post(
    "/alerts",
    response_model=SOSAlertResponse,
    status_code=201,
)
def create_sos_alert(
    payload: SOSAlertCreate,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_roles(
            "Student"
        )
    ),
):
    student = get_student_for_user(
        db,
        current_user,
    )

    category = normalize_category(
        payload.category
    )

    description = validate_description(
        payload.description
    )

    location = normalize_location(
        payload.location
    )

    alert = SOSAlert(
        student_id=student.id,
        category=category,
        description=description,
        location=location,
        status="Pending",
    )

    db.add(alert)
    db.flush()

    log = SOSAlertLog(
        alert_id=alert.id,
        action="Alert Created",
        performed_by=current_user.id,
        note=(
            f"{category} emergency "
            "alert created."
        ),
    )

    db.add(log)

    db.commit()
    db.refresh(alert)

    return build_alert_response(
        alert,
        student,
    )


@router.get(
    "/my-alerts",
    response_model=list[
        SOSAlertResponse
    ],
)
def get_my_sos_alerts(
    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_roles(
            "Student"
        )
    ),
):
    student = get_student_for_user(
        db,
        current_user,
    )

    alerts = (
        db.query(SOSAlert)
        .filter(
            SOSAlert.student_id
            == student.id
        )
        .order_by(
            SOSAlert.created_at.desc()
        )
        .all()
    )

    return [
        build_alert_response(
            alert,
            student,
        )
        for alert in alerts
    ]


@router.get(
    "/alerts",
    response_model=list[
        SOSAlertResponse
    ],
)
def get_all_sos_alerts(
    status_filter: str | None = Query(
        default=None
    ),

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_roles(
            "Admin",
            "Warden",
        )
    ),
):
    query = (
        db.query(
            SOSAlert,
            Student,
        )
        .join(
            Student,
            Student.id
            == SOSAlert.student_id,
        )
    )

    if status_filter:
        normalized_status = (
            status_filter
            .strip()
            .title()
        )

        if normalized_status not in ALLOWED_STATUSES:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid status filter."
                ),
            )

        query = query.filter(
            SOSAlert.status
            == normalized_status
        )

    rows = (
        query.order_by(
            case(
                (
                    SOSAlert.status
                    == "Pending",
                    0,
                ),
                else_=1,
            ),

            SOSAlert.created_at.desc(),
        )
        .all()
    )

    return [
        build_alert_response(
            alert,
            student,
        )
        for alert, student
        in rows
    ]


@router.put(
    "/alerts/{alert_id}/verify",
    response_model=SOSAlertResponse,
)
def verify_sos_alert(
    alert_id: int,

    payload: SOSAlertVerify,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_roles(
            "Warden"
        )
    ),
):
    alert = (
        db.query(SOSAlert)
        .filter(
            SOSAlert.id == alert_id
        )
        .first()
    )

    if alert is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "SOS alert not found."
            ),
        )

    if alert.status != "Pending":
        raise HTTPException(
            status_code=409,
            detail=(
                "This emergency alert "
                "has already been verified."
            ),
        )

    decision = (
        payload.decision
        .strip()
        .title()
    )

    if decision not in {
        "Genuine",
        "False",
    }:
        raise HTTPException(
            status_code=400,
            detail=(
                "Decision must be "
                "Genuine or False."
            ),
        )

    note = (
        payload.verification_note
        .strip()
        if payload.verification_note
        else None
    )

    if (
        note is not None
        and len(note) > 500
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Verification note "
                "cannot exceed "
                "500 characters."
            ),
        )

    student = (
        db.query(Student)
        .filter(
            Student.id
            == alert.student_id
        )
        .first()
    )

    if student is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "Student record "
                "was not found."
            ),
        )

    now = india_now_naive()

    alert.status = decision

    alert.verified_by = (
        current_user.id
    )

    alert.verified_at = now

    alert.verification_note = note

    verification_log = SOSAlertLog(
        alert_id=alert.id,

        action=(
            "Marked Genuine"
            if decision == "Genuine"
            else "Marked False"
        ),

        performed_by=(
            current_user.id
        ),

        note=note,
    )

    db.add(verification_log)

    db.commit()
    db.refresh(alert)


    if decision == "Genuine":

        if student.parent_email:

            try:
                send_parent_sos_notification(
                    parent_email=(
                        student.parent_email
                    ),

                    parent_name=(
                        student.parent_name
                    ),

                    student_name=(
                        student.name
                    ),

                    student_code=(
                        student.student_code
                    ),

                    category=(
                        alert.category
                    ),

                    location=(
                        alert.location
                    ),

                    verified_time=(
                        now.strftime(
                            "%d-%m-%Y "
                            "%I:%M %p"
                        )
                    ),

                    verification_note=(
                        alert.verification_note
                    ),
                )

                alert.parent_notified = True

                alert.parent_notified_at = (
                    india_now_naive()
                )

                db.add(
                    SOSAlertLog(
                        alert_id=alert.id,
                        action=(
                            "Parent Notified"
                        ),
                        performed_by=(
                            current_user.id
                        ),
                        note=(
                            "Parent/guardian "
                            "notification email sent."
                        ),
                    )
                )

            except Exception:
                db.add(
                    SOSAlertLog(
                        alert_id=alert.id,
                        action=(
                            "Parent Notification Failed"
                        ),
                        performed_by=(
                            current_user.id
                        ),
                        note=(
                            "Parent/guardian email "
                            "notification could not "
                            "be sent."
                        ),
                    )
                )

        else:
            db.add(
                SOSAlertLog(
                    alert_id=alert.id,
                    action=(
                        "Parent Notification Skipped"
                    ),
                    performed_by=(
                        current_user.id
                    ),
                    note=(
                        "No parent email is "
                        "stored for this student."
                    ),
                )
            )

        db.commit()
        db.refresh(alert)


    return build_alert_response(
        alert,
        student,
    )


@router.get(
    "/alerts/{alert_id}/logs",
    response_model=list[
        SOSAlertLogResponse
    ],
)
def get_sos_alert_logs(
    alert_id: int,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_roles(
            "Admin",
            "Warden",
        )
    ),
):
    alert = (
        db.query(SOSAlert)
        .filter(
            SOSAlert.id == alert_id
        )
        .first()
    )

    if alert is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "SOS alert not found."
            ),
        )

    return (
        db.query(SOSAlertLog)
        .filter(
            SOSAlertLog.alert_id
            == alert_id
        )
        .order_by(
            SOSAlertLog
            .created_at
            .asc()
        )
        .all()
    )