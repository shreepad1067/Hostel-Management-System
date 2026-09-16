from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.leave import Leave
from models.student import Student
from models.user import User
from schemas.leave import LeaveCreate, LeaveUpdate, LeaveResponse
from dependencies import require_roles


router = APIRouter(
    prefix="/leaves",
    tags=["Leaves"]
)


# CREATE LEAVE - ADMIN / WARDEN
@router.post("/", response_model=LeaveResponse)
def create_leave(
    leave: LeaveCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin", "Warden")
    )
):
    # Check whether student exists
    student = db.query(Student).filter(
        Student.id == leave.student_id
    ).first()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    # Validate leave dates
    if leave.end_date < leave.start_date:
        raise HTTPException(
            status_code=400,
            detail="End date cannot be before start date"
        )

    new_leave = Leave(
        student_id=leave.student_id,
        leave_type=leave.leave_type,
        reason=leave.reason,
        start_date=leave.start_date,
        end_date=leave.end_date,
        status=leave.status,
        applied_date=leave.applied_date,
        remarks=leave.remarks
    )

    db.add(new_leave)
    db.commit()
    db.refresh(new_leave)

    return new_leave


# CREATE LEAVE - STUDENT
@router.post(
    "/my-leave",
    response_model=LeaveResponse
)
def create_my_leave(
    leave: LeaveCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Student")
    )
):
    # Find the student profile linked to this user
    student = db.query(Student).filter(
        Student.user_id == current_user.id
    ).first()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student profile is not linked to this user"
        )

    # Validate leave dates
    if leave.end_date < leave.start_date:
        raise HTTPException(
            status_code=400,
            detail="End date cannot be before start date"
        )

    new_leave = Leave(
        student_id=student.id,
        leave_type=leave.leave_type,
        reason=leave.reason,
        start_date=leave.start_date,
        end_date=leave.end_date,
        status="Pending",
        applied_date=leave.applied_date,
        remarks=leave.remarks
    )

    db.add(new_leave)
    db.commit()
    db.refresh(new_leave)

    return new_leave


# GET ALL LEAVES - ADMIN / WARDEN
@router.get(
    "/",
    response_model=list[LeaveResponse]
)
def get_leaves(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin", "Warden")
    )
):
    leaves = db.query(Leave).all()

    return leaves


# GET MY LEAVES - STUDENT
@router.get(
    "/my-leaves",
    response_model=list[LeaveResponse]
)
def get_my_leaves(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Student")
    )
):
    # Find the student profile linked to this user
    student = db.query(Student).filter(
        Student.user_id == current_user.id
    ).first()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student profile is not linked to this user"
        )

    leaves = db.query(Leave).filter(
        Leave.student_id == student.id
    ).order_by(
        Leave.id.desc()
    ).all()

    return leaves


# GET LEAVE BY ID - ADMIN / WARDEN
@router.get(
    "/{leave_id}",
    response_model=LeaveResponse
)
def get_leave(
    leave_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin", "Warden")
    )
):
    leave = db.query(Leave).filter(
        Leave.id == leave_id
    ).first()

    if not leave:
        raise HTTPException(
            status_code=404,
            detail="Leave request not found"
        )

    return leave


# UPDATE LEAVE - ADMIN / WARDEN
@router.put(
    "/{leave_id}",
    response_model=LeaveResponse
)
def update_leave(
    leave_id: int,
    leave_data: LeaveUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin", "Warden")
    )
):
    leave = db.query(Leave).filter(
        Leave.id == leave_id
    ).first()

    if not leave:
        raise HTTPException(
            status_code=404,
            detail="Leave request not found"
        )

    # Check whether student exists
    student = db.query(Student).filter(
        Student.id == leave_data.student_id
    ).first()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    # Validate leave dates
    if leave_data.end_date < leave_data.start_date:
        raise HTTPException(
            status_code=400,
            detail="End date cannot be before start date"
        )

    leave.student_id = leave_data.student_id
    leave.leave_type = leave_data.leave_type
    leave.reason = leave_data.reason
    leave.start_date = leave_data.start_date
    leave.end_date = leave_data.end_date
    leave.status = leave_data.status
    leave.applied_date = leave_data.applied_date
    leave.remarks = leave_data.remarks

    db.commit()
    db.refresh(leave)

    return leave


# DELETE LEAVE - ADMIN / WARDEN
@router.delete("/{leave_id}")
def delete_leave(
    leave_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin", "Warden")
    )
):
    leave = db.query(Leave).filter(
        Leave.id == leave_id
    ).first()

    if not leave:
        raise HTTPException(
            status_code=404,
            detail="Leave request not found"
        )

    db.delete(leave)
    db.commit()

    return {
        "message": "Leave request deleted successfully"
    }