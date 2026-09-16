from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.fee import Fee
from models.student import Student
from models.user import User
from schemas.fee import FeeCreate, FeeUpdate, FeeResponse
from dependencies import require_roles


router = APIRouter(
    prefix="/fees",
    tags=["Fees"]
)


# CREATE FEE
@router.post("/", response_model=FeeResponse)
def create_fee(
    fee: FeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Warden"))
):
    # Check whether student exists
    student = db.query(Student).filter(
        Student.id == fee.student_id
    ).first()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    new_fee = Fee(
        student_id=fee.student_id,
        amount=fee.amount,
        due_date=fee.due_date,
        payment_date=fee.payment_date,
        status=fee.status,
        payment_method=fee.payment_method,
        description=fee.description
    )

    db.add(new_fee)
    db.commit()
    db.refresh(new_fee)

    return new_fee


# GET MY FEES
@router.get(
    "/my-fees",
    response_model=list[FeeResponse]
)
def get_my_fees(
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

    fees = db.query(Fee).filter(
        Fee.student_id == student.id
    ).all()

    return fees


# GET ALL FEES
@router.get("/", response_model=list[FeeResponse])
def get_fees(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Warden"))
):
    fees = db.query(Fee).all()

    return fees


# GET FEE BY ID
@router.get("/{fee_id}", response_model=FeeResponse)
def get_fee(
    fee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Warden"))
):
    fee = db.query(Fee).filter(
        Fee.id == fee_id
    ).first()

    if not fee:
        raise HTTPException(
            status_code=404,
            detail="Fee not found"
        )

    return fee


# UPDATE FEE
@router.put("/{fee_id}", response_model=FeeResponse)
def update_fee(
    fee_id: int,
    fee_data: FeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Warden"))
):
    fee = db.query(Fee).filter(
        Fee.id == fee_id
    ).first()

    if not fee:
        raise HTTPException(
            status_code=404,
            detail="Fee not found"
        )

    # Check whether student exists
    student = db.query(Student).filter(
        Student.id == fee_data.student_id
    ).first()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    fee.student_id = fee_data.student_id
    fee.amount = fee_data.amount
    fee.due_date = fee_data.due_date
    fee.payment_date = fee_data.payment_date
    fee.status = fee_data.status
    fee.payment_method = fee_data.payment_method
    fee.description = fee_data.description

    db.commit()
    db.refresh(fee)

    return fee


# DELETE FEE
@router.delete("/{fee_id}")
def delete_fee(
    fee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Warden"))
):
    fee = db.query(Fee).filter(
        Fee.id == fee_id
    ).first()

    if not fee:
        raise HTTPException(
            status_code=404,
            detail="Fee not found"
        )

    db.delete(fee)
    db.commit()

    return {
        "message": "Fee deleted successfully"
    }