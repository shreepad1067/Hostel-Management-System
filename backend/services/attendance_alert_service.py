from models.parent_alert import ParentAlert
from models.student import Student
from services.parent_alert_service import queue_parent_alert


def sync_attendance_alert(db, record, *, deleted=False):
    """Keep an unsent alert consistent with the attendance record."""
    key = record.attendance_date.isoformat()
    alert = (
        db.query(ParentAlert)
        .filter(
            ParentAlert.student_id == record.student_id,
            ParentAlert.alert_type == "AttendanceAbsent",
            ParentAlert.reference_key == key,
        )
        .with_for_update()
        .first()
    )

    student = db.get(Student, record.student_id)
    email = ((student.parent_email or "").strip() if student else "")
    should_queue = not deleted and record.status == "Absent" and bool(email)

    if not should_queue:
        if alert and alert.status in ("Pending", "Failed"):
            alert.status = "Cancelled"
        return

    if alert and alert.status == "Sent":
        return

    message = (
        "Dear Parent/Guardian,\n\n"
        f"{student.name} was marked Absent in hostel attendance "
        f"on {record.attendance_date:%d-%m-%Y}.\n"
        f"Remarks: {(record.remarks or '').strip() or 'Not provided'}\n\n"
        "Please contact the hostel warden for clarification."
    )

    if alert:
        alert.recipient_email = email
        alert.subject = "HostelHub: Student marked absent"
        alert.message = message
        if alert.status == "Cancelled":
            alert.status = "Pending"
            alert.attempts = 0
        return

    queue_parent_alert(
        db=db,
        student_id=record.student_id,
        parent_email=email,
        alert_type="AttendanceAbsent",
        reference_key=key,
        subject="HostelHub: Student marked absent",
        message=message,
    )
