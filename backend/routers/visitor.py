from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.visitor import Visitor
from models.student import Student
from models.user import User
from schemas.visitor import (
    VisitorCreate,
    VisitorUpdate,
    VisitorResponse
)
from dependencies import require_roles


router = APIRouter(
    prefix="/visitors",
    tags=["Visitors"]
)


# CREATE VISITOR - ADMIN / WARDEN
@router.post(
    "/",
    response_model=VisitorResponse
)
def create_visitor(
    visitor: VisitorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin", "Warden")
    )
):
    # Check whether student exists
    student = db.query(Student).filter(
        Student.id == visitor.student_id
    ).first()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    # Validate check-in and check-out time
    if visitor.check_in and visitor.check_out:
        if visitor.check_out < visitor.check_in:
            raise HTTPException(
                status_code=400,
                detail="Check-out time cannot be before check-in time"
            )

    new_visitor = Visitor(
        student_id=visitor.student_id,
        visitor_name=visitor.visitor_name,
        relation=visitor.relation,
        phone=visitor.phone,
        purpose=visitor.purpose,
        visit_date=visitor.visit_date,
        check_in=visitor.check_in,
        check_out=visitor.check_out,
        status=visitor.status,
        remarks=visitor.remarks
    )

    db.add(new_visitor)
    db.commit()
    db.refresh(new_visitor)

    return new_visitor


# CREATE VISITOR - STUDENT
@router.post(
    "/my-visitor",
    response_model=VisitorResponse
)
def create_my_visitor(
    visitor: VisitorCreate,
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

    # Validate check-in and check-out time
    if visitor.check_in and visitor.check_out:
        if visitor.check_out < visitor.check_in:
            raise HTTPException(
                status_code=400,
                detail="Check-out time cannot be before check-in time"
            )

    new_visitor = Visitor(
        student_id=student.id,
        visitor_name=visitor.visitor_name,
        relation=visitor.relation,
        phone=visitor.phone,
        purpose=visitor.purpose,
        visit_date=visitor.visit_date,
        check_in=visitor.check_in,
        check_out=visitor.check_out,
        status="Pending",
        remarks=visitor.remarks
    )

    db.add(new_visitor)
    db.commit()
    db.refresh(new_visitor)

    return new_visitor


# GET ALL VISITORS - ADMIN / WARDEN
@router.get(
    "/",
    response_model=list[VisitorResponse]
)
def get_visitors(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin", "Warden")
    )
):
    visitors = db.query(Visitor).all()

    return visitors


# GET MY VISITORS - STUDENT
@router.get(
    "/my-visitors",
    response_model=list[VisitorResponse]
)
def get_my_visitors(
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

    visitors = db.query(Visitor).filter(
        Visitor.student_id == student.id
    ).order_by(
        Visitor.id.desc()
    ).all()

    return visitors


# GET VISITOR BY ID - ADMIN / WARDEN
@router.get(
    "/{visitor_id}",
    response_model=VisitorResponse
)
def get_visitor(
    visitor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin", "Warden")
    )
):
    visitor = db.query(Visitor).filter(
        Visitor.id == visitor_id
    ).first()

    if not visitor:
        raise HTTPException(
            status_code=404,
            detail="Visitor record not found"
        )

    return visitor


# UPDATE VISITOR - ADMIN / WARDEN
@router.put(
    "/{visitor_id}",
    response_model=VisitorResponse
)
def update_visitor(
    visitor_id: int,
    visitor_data: VisitorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin", "Warden")
    )
):
    visitor = db.query(Visitor).filter(
        Visitor.id == visitor_id
    ).first()

    if not visitor:
        raise HTTPException(
            status_code=404,
            detail="Visitor record not found"
        )

    # Check whether student exists
    student = db.query(Student).filter(
        Student.id == visitor_data.student_id
    ).first()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    # Validate check-in and check-out time
    if visitor_data.check_in and visitor_data.check_out:
        if visitor_data.check_out < visitor_data.check_in:
            raise HTTPException(
                status_code=400,
                detail="Check-out time cannot be before check-in time"
            )

    visitor.student_id = visitor_data.student_id
    visitor.visitor_name = visitor_data.visitor_name
    visitor.relation = visitor_data.relation
    visitor.phone = visitor_data.phone
    visitor.purpose = visitor_data.purpose
    visitor.visit_date = visitor_data.visit_date
    visitor.check_in = visitor_data.check_in
    visitor.check_out = visitor_data.check_out
    visitor.status = visitor_data.status
    visitor.remarks = visitor_data.remarks

    db.commit()
    db.refresh(visitor)

    return visitor


# DELETE VISITOR - ADMIN / WARDEN
@router.delete("/{visitor_id}")
def delete_visitor(
    visitor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin", "Warden")
    )
):
    visitor = db.query(Visitor).filter(
        Visitor.id == visitor_id
    ).first()

    if not visitor:
        raise HTTPException(
            status_code=404,
            detail="Visitor record not found"
        )

    db.delete(visitor)
    db.commit()

    return {
        "message": "Visitor record deleted successfully"
    }