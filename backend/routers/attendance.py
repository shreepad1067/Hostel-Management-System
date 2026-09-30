from datetime import date
from zoneinfo import ZoneInfo
from datetime import datetime

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
)

from sqlalchemy import and_
from sqlalchemy.orm import Session

from database import get_db
from dependencies import require_roles

from models.attendance import Attendance
from models.room import Room
from models.student import Student
from models.user import User

from schemas.attendance import (
    AttendanceBlockResponse,
    AttendanceBulkRequest,
    AttendanceCreate,
    AttendanceResponse,
    AttendanceRosterItem,
    AttendanceUpdate,
)


router = APIRouter(
    prefix="/attendance",
    tags=["Attendance"],
)


INDIA_TIMEZONE = ZoneInfo(
    "Asia/Kolkata"
)


ALLOWED_STATUSES = {
    "Present",
    "Absent",
    "Leave",
}


def normalize_status(
    value: str,
) -> str:
    value = value.strip().title()

    if value not in ALLOWED_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Status must be Present, "
                "Absent, or Leave."
            ),
        )

    return value


def today_india() -> date:
    return datetime.now(
        INDIA_TIMEZONE
    ).date()


@router.get(
    "/blocks",
    response_model=list[
        AttendanceBlockResponse
    ],
)
def attendance_blocks(
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
            Room.block,
            Room.floor,
        )
        .filter(
            Room.block.isnot(None)
        )
        .distinct()
        .order_by(
            Room.block,
            Room.floor,
        )
        .all()
    )

    grouped = {}

    for block, floor in rows:
        if not block:
            continue

        grouped.setdefault(
            block,
            set(),
        )

        grouped[block].add(
            floor
        )

    return [
        {
            "block": block,
            "floors": sorted(
                floors
            ),
        }

        for (
            block,
            floors,
        )
        in grouped.items()
    ]


@router.get(
    "/roster",
    response_model=list[
        AttendanceRosterItem
    ],
)
def attendance_roster(
    block: str,

    floor: int | None = Query(
        default=None
    ),

    attendance_date: date | None = Query(
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
        attendance_date
        or today_india()
    )

    query = (
        db.query(
            Student,
            Room,
            Attendance,
        )
        .join(
            Room,
            Student.room_number
            == Room.room_number,
        )
        .outerjoin(
            Attendance,
            and_(
                Attendance.student_id
                == Student.id,

                Attendance.attendance_date
                == target_date,
            ),
        )
        .filter(
            Room.block == block
        )
    )

    if floor is not None:
        query = query.filter(
            Room.floor == floor
        )

    rows = (
        query
        .order_by(
            Room.floor,
            Room.room_number,
            Student.name,
        )
        .all()
    )

    return [
        AttendanceRosterItem(
            student_id=student.id,
            student_code=student.student_code,
            student_name=student.name,
            room_number=student.room_number,
            block=room.block,
            floor=room.floor,
            attendance_id=(
                attendance.id
                if attendance
                else None
            ),
            status=(
                attendance.status
                if attendance
                else None
            ),
            remarks=(
                attendance.remarks
                if attendance
                else None
            ),
        )

        for (
            student,
            room,
            attendance,
        )
        in rows
    ]


@router.post(
    "/bulk"
)
def save_bulk_attendance(
    payload: AttendanceBulkRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Warden")
    ),
):
    updated = 0

    for entry in payload.entries:
        student = (
            db.query(Student)
            .filter(
                Student.id
                == entry.student_id
            )
            .first()
        )

        if student is None:
            continue

        room = (
            db.query(Room)
            .filter(
                Room.room_number
                == student.room_number
            )
            .first()
        )

        if room is None:
            continue

        if room.block != payload.block:
            continue

        if (
            payload.floor is not None
            and room.floor
            != payload.floor
        ):
            continue

        record = (
            db.query(Attendance)
            .filter(
                Attendance.student_id
                == student.id,

                Attendance.attendance_date
                == payload.attendance_date,
            )
            .first()
        )

        attendance_status = (
            normalize_status(
                entry.status
            )
        )

        if record:
            record.status = (
                attendance_status
            )

            record.remarks = (
                entry.remarks
            )

        else:
            record = Attendance(
                student_id=student.id,
                attendance_date=(
                    payload.attendance_date
                ),
                status=attendance_status,
                remarks=entry.remarks,
            )

            db.add(record)

        updated += 1

    db.commit()

    return {
        "message":
            "Attendance saved successfully.",

        "updated":
            updated,
    }


@router.post(
    "/",
    response_model=AttendanceResponse,
)
def create_attendance(
    payload: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Warden")
    ),
):
    student = (
        db.query(Student)
        .filter(
            Student.id
            == payload.student_id
        )
        .first()
    )

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found.",
        )

    existing = (
        db.query(Attendance)
        .filter(
            Attendance.student_id
            == payload.student_id,

            Attendance.attendance_date
            == payload.attendance_date,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail=(
                "Attendance already exists "
                "for this student and date."
            ),
        )

    record = Attendance(
        student_id=payload.student_id,
        attendance_date=(
            payload.attendance_date
        ),
        status=normalize_status(
            payload.status
        ),
        remarks=payload.remarks,
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return record


@router.get(
    "/",
    response_model=list[
        AttendanceResponse
    ],
)
def all_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "Admin",
            "Warden",
        )
    ),
):
    return (
        db.query(Attendance)
        .order_by(
            Attendance
            .attendance_date
            .desc()
        )
        .all()
    )


@router.get(
    "/my-attendance",
    response_model=list[
        AttendanceResponse
    ],
)
def my_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Student")
    ),
):
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
                "Student profile is not "
                "linked to this account."
            ),
        )

    return (
        db.query(Attendance)
        .filter(
            Attendance.student_id
            == student.id
        )
        .order_by(
            Attendance
            .attendance_date
            .desc()
        )
        .all()
    )


@router.get(
    "/{attendance_id}",
    response_model=AttendanceResponse,
)
def attendance_by_id(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "Admin",
            "Warden",
        )
    ),
):
    record = (
        db.query(Attendance)
        .filter(
            Attendance.id
            == attendance_id
        )
        .first()
    )

    if record is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "Attendance record not found."
            ),
        )

    return record


@router.put(
    "/{attendance_id}",
    response_model=AttendanceResponse,
)
def update_attendance(
    attendance_id: int,
    payload: AttendanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Warden")
    ),
):
    record = (
        db.query(Attendance)
        .filter(
            Attendance.id
            == attendance_id
        )
        .first()
    )

    if record is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "Attendance record not found."
            ),
        )

    record.status = (
        normalize_status(
            payload.status
        )
    )

    record.remarks = (
        payload.remarks
    )

    db.commit()
    db.refresh(record)

    return record


@router.delete(
    "/{attendance_id}"
)
def delete_attendance(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Warden")
    ),
):
    record = (
        db.query(Attendance)
        .filter(
            Attendance.id
            == attendance_id
        )
        .first()
    )

    if record is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "Attendance record not found."
            ),
        )

    db.delete(record)
    db.commit()

    return {
        "message":
            "Attendance deleted successfully"
    }