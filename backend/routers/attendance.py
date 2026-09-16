from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.attendance import Attendance
from models.student import Student
from models.user import User
from schemas.attendance import (
    AttendanceCreate,
    AttendanceUpdate,
    AttendanceResponse
)
from dependencies import require_roles


router = APIRouter(
    prefix="/attendance",
    tags=["Attendance"]
)


# CREATE ATTENDANCE - MANAGEMENT
@router.post("/", response_model=AttendanceResponse)
def create_attendance(
    attendance: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin", "Warden")
    )
):
    student = db.query(Student).filter(
        Student.id == attendance.student_id
    ).first()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    existing_attendance = db.query(Attendance).filter(
        Attendance.student_id == attendance.student_id,
        Attendance.attendance_date == attendance.attendance_date
    ).first()

    if existing_attendance:
        raise HTTPException(
            status_code=400,
            detail="Attendance already marked for this student on this date"
        )

    new_attendance = Attendance(
        student_id=attendance.student_id,
        attendance_date=attendance.attendance_date,
        status=attendance.status,
        remarks=attendance.remarks
    )

    db.add(new_attendance)
    db.commit()
    db.refresh(new_attendance)

    return new_attendance


# GET ALL ATTENDANCE - MANAGEMENT
@router.get("/", response_model=list[AttendanceResponse])
def get_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin", "Warden")
    )
):
    attendance_records = db.query(Attendance).all()

    return attendance_records


# GET MY ATTENDANCE - STUDENT
@router.get(
    "/my-attendance",
    response_model=list[AttendanceResponse]
)
def get_my_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Student")
    )
):
    student = db.query(Student).filter(
        Student.user_id == current_user.id
    ).first()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student profile is not linked to this user"
        )

    attendance_records = db.query(Attendance).filter(
        Attendance.student_id == student.id
    ).order_by(
        Attendance.attendance_date.desc()
    ).all()

    return attendance_records


# GET ATTENDANCE BY ID - MANAGEMENT
@router.get(
    "/{attendance_id}",
    response_model=AttendanceResponse
)
def get_attendance_by_id(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin", "Warden")
    )
):
    attendance = db.query(Attendance).filter(
        Attendance.id == attendance_id
    ).first()

    if not attendance:
        raise HTTPException(
            status_code=404,
            detail="Attendance record not found"
        )

    return attendance


# UPDATE ATTENDANCE - MANAGEMENT
@router.put(
    "/{attendance_id}",
    response_model=AttendanceResponse
)
def update_attendance(
    attendance_id: int,
    attendance_data: AttendanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin", "Warden")
    )
):
    attendance = db.query(Attendance).filter(
        Attendance.id == attendance_id
    ).first()

    if not attendance:
        raise HTTPException(
            status_code=404,
            detail="Attendance record not found"
        )

    student = db.query(Student).filter(
        Student.id == attendance_data.student_id
    ).first()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    existing_attendance = db.query(Attendance).filter(
        Attendance.student_id == attendance_data.student_id,
        Attendance.attendance_date == attendance_data.attendance_date,
        Attendance.id != attendance_id
    ).first()

    if existing_attendance:
        raise HTTPException(
            status_code=400,
            detail="Attendance already marked for this student on this date"
        )

    attendance.student_id = attendance_data.student_id
    attendance.attendance_date = attendance_data.attendance_date
    attendance.status = attendance_data.status
    attendance.remarks = attendance_data.remarks

    db.commit()
    db.refresh(attendance)

    return attendance


# DELETE ATTENDANCE - MANAGEMENT
@router.delete("/{attendance_id}")
def delete_attendance(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin", "Warden")
    )
):
    attendance = db.query(Attendance).filter(
        Attendance.id == attendance_id
    ).first()

    if not attendance:
        raise HTTPException(
            status_code=404,
            detail="Attendance record not found"
        )

    db.delete(attendance)
    db.commit()

    return {
        "message": "Attendance deleted successfully"
    }