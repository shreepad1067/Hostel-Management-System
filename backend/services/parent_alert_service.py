from datetime import datetime, timezone

from sqlalchemy.exc import IntegrityError

from models.parent_alert import ParentAlert
from services.notification_service import send_email


def queue_parent_alert(
    db,
    student_id,
    parent_email,
    alert_type,
    reference_key,
    subject,
    message,
):
    """Queue one notification per student and event."""

    if not parent_email or not parent_email.strip():
        return None

    existing = (
        db.query(ParentAlert)
        .filter(
            ParentAlert.student_id == student_id,
            ParentAlert.alert_type == alert_type,
            ParentAlert.reference_key == reference_key,
        )
        .with_for_update()
        .first()
    )

    if existing is not None:
        if existing.status != "Cancelled":
            return None

        existing.recipient_email = parent_email.strip()
        existing.subject = subject
        existing.message = message
        existing.status = "Pending"
        existing.attempts = 0
        existing.sent_at = None
        db.flush()
        return existing

    alert = ParentAlert(
        student_id=student_id,
        recipient_email=parent_email.strip(),
        alert_type=alert_type,
        reference_key=reference_key,
        subject=subject,
        message=message,
        status="Pending",
        attempts=0,
    )

    try:
        with db.begin_nested():
            db.add(alert)
            db.flush()
    except IntegrityError:
        return None

    return alert


def deliver_parent_alert(db, alert):
    """Attempt email delivery and record the result."""

    if alert.status == "Sent":
        return True

    if alert.status not in ("Pending", "Failed"):
        return False

    if alert.attempts >= 5:
        return False

    alert.attempts += 1

    try:
        send_email(
            alert.recipient_email,
            alert.subject,
            alert.message,
        )
        alert.status = "Sent"
        alert.sent_at = datetime.now(timezone.utc).replace(
            tzinfo=None
        )
        db.commit()
        return True

    except Exception as exc:
        alert.status = "Failed"
        db.commit()
        print(
            f"Parent alert {alert.id} failed: "
            f"{type(exc).__name__}"
        )
        return False
