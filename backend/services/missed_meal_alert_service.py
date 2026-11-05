from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from models.leave import Leave
from models.meal_confirmation import MealConfirmation, MealQRSession
from models.student import Student
from services.parent_alert_service import queue_parent_alert


INDIA_TIMEZONE = ZoneInfo("Asia/Kolkata")


def queue_missed_meal_alerts(db, *, dry_run=True, now=None):
    """Recover recent meal deadlines. Caller owns the transaction."""
    now = now or datetime.now(timezone.utc)
    if now.tzinfo is None:
        raise ValueError("now must include a timezone")

    today = now.astimezone(INDIA_TIMEZONE).date()
    utc_now = now.astimezone(timezone.utc).replace(tzinfo=None)
    recovery_cutoff = utc_now - timedelta(hours=24)
    first_date = today - timedelta(days=1)

    sessions = (
        db.query(MealQRSession)
        .filter(
            MealQRSession.meal_date >= first_date,
            MealQRSession.meal_date <= today,
        )
        .order_by(MealQRSession.id.desc())
        .all()
    )

    # A regenerated QR replaces the earlier deadline for that meal.
    latest = {}
    for session in sessions:
        latest.setdefault((session.meal_date, session.meal_type), session)

    results = []
    for (meal_date, meal_type), session in latest.items():
        if not recovery_cutoff <= session.expires_at <= utc_now:
            continue

        # Do not filter is_active: an expired scan can set it to False.
        collected = (
            db.query(MealConfirmation.student_id)
            .filter(
                MealConfirmation.meal_date == meal_date,
                MealConfirmation.meal_type == meal_type,
                MealConfirmation.status == "Collected",
            )
        )
        on_leave = (
            db.query(Leave.student_id)
            .filter(
                Leave.status == "Approved",
                Leave.start_date <= meal_date,
                Leave.end_date >= meal_date,
            )
        )
        students = (
            db.query(Student)
            .filter(
                Student.admission_status == "Admitted",
                Student.room_number.isnot(None),
                Student.room_number != "",
                Student.parent_email.isnot(None),
                ~Student.id.in_(collected),
                ~Student.id.in_(on_leave),
            )
            .all()
        )

        deadline = session.expires_at.replace(
            tzinfo=timezone.utc
        ).astimezone(INDIA_TIMEZONE)

        for student in students:
            # Avoid alerts for meals before the student's admission.
            if student.admission_date is not None:
                if student.admission_date > meal_date:
                    continue
            elif meal_date < today:
                continue

            if not student.parent_email.strip():
                continue

            result = {
                "student_id": student.id,
                "meal_type": meal_type,
                "meal_date": meal_date.isoformat(),
                "deadline": deadline.isoformat(),
                "queued": False,
            }

            if not dry_run:
                alert = queue_parent_alert(
                    db=db,
                    student_id=student.id,
                    parent_email=student.parent_email,
                    alert_type="MissedMeal",
                    reference_key=f"{meal_date.isoformat()}:{meal_type}",
                    subject=f"HostelHub: {meal_type} collection not recorded",
                    message=(
                        "Dear Parent/Guardian,\n\n"
                        f"No {meal_type} QR collection was recorded for "
                        f"{student.name} on {meal_date:%d-%m-%Y} by "
                        f"{deadline:%I:%M %p} IST.\n"
                        "This means no scan was recorded; it does not "
                        "confirm that the student did not eat.\n\n"
                        "Please contact the hostel warden for clarification."
                    ),
                )
                result["queued"] = alert is not None

            results.append(result)

    return results
