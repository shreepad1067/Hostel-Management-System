from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.complaint import Complaint
from models.student import Student
from models.user import User
from schemas.complaint import (
    ComplaintCreate,
    ComplaintUpdate,
    ComplaintResponse
)
from dependencies import require_roles


router = APIRouter(
    prefix="/complaints",
    tags=["Complaints"]
)


# CREATE COMPLAINT
@router.post("/", response_model=ComplaintResponse)
def create_complaint(
    complaint: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin", "Warden", "Student")
    )
):
    # Admin/Warden can create a complaint for any student
    if current_user.role in ["Admin", "Warden"]:
        student = db.query(Student).filter(
            Student.id == complaint.student_id
        ).first()

        if not student:
            raise HTTPException(
                status_code=404,
                detail="Student not found"
            )

        student_id = complaint.student_id

    # Student can create a complaint only for themselves
    else:
        student = db.query(Student).filter(
            Student.user_id == current_user.id
        ).first()

        if not student:
            raise HTTPException(
                status_code=404,
                detail="Student profile is not linked to this user"
            )

        student_id = student.id

    new_complaint = Complaint(
        student_id=student_id,
        title=complaint.title,
        description=complaint.description,
        category=complaint.category,
        complaint_date=complaint.complaint_date,
        status="Pending",
        resolution=None
    )

    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)

    return new_complaint


# GET ALL / OWN COMPLAINTS
@router.get("/", response_model=list[ComplaintResponse])
def get_complaints(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin", "Warden", "Student")
    )
):
    # Admin/Warden can see all complaints
    if current_user.role in ["Admin", "Warden"]:
        complaints = db.query(Complaint).all()

        return complaints

    # Student can see only their own complaints
    student = db.query(Student).filter(
        Student.user_id == current_user.id
    ).first()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student profile is not linked to this user"
        )

    complaints = db.query(Complaint).filter(
        Complaint.student_id == student.id
    ).all()

    return complaints


# GET COMPLAINT BY ID
@router.get("/{complaint_id}", response_model=ComplaintResponse)
def get_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin", "Warden", "Student")
    )
):
    complaint = db.query(Complaint).filter(
        Complaint.id == complaint_id
    ).first()

    if not complaint:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found"
        )

    # Admin/Warden can access any complaint
    if current_user.role in ["Admin", "Warden"]:
        return complaint

    # Student can access only their own complaint
    student = db.query(Student).filter(
        Student.user_id == current_user.id
    ).first()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student profile is not linked to this user"
        )

    if complaint.student_id != student.id:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to access this complaint"
        )

    return complaint


# UPDATE COMPLAINT
@router.put("/{complaint_id}", response_model=ComplaintResponse)
def update_complaint(
    complaint_id: int,
    complaint_data: ComplaintUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin", "Warden")
    )
):
    complaint = db.query(Complaint).filter(
        Complaint.id == complaint_id
    ).first()

    if not complaint:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found"
        )

    student = db.query(Student).filter(
        Student.id == complaint_data.student_id
    ).first()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    complaint.student_id = complaint_data.student_id
    complaint.title = complaint_data.title
    complaint.description = complaint_data.description
    complaint.category = complaint_data.category
    complaint.complaint_date = complaint_data.complaint_date
    complaint.status = complaint_data.status
    complaint.resolution = complaint_data.resolution

    db.commit()
    db.refresh(complaint)

    return complaint


# DELETE COMPLAINT
@router.delete("/{complaint_id}")
def delete_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin", "Warden")
    )
):
    complaint = db.query(Complaint).filter(
        Complaint.id == complaint_id
    ).first()

    if not complaint:
        raise HTTPException(
            status_code=404,
            detail="Complaint not found"
        )

    db.delete(complaint)
    db.commit()

    return {
        "message": "Complaint deleted successfully"
    }