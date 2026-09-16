from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from models.student import Student
from models.user import User
from schemas.student import StudentCreate, StudentUpdate, StudentResponse
from dependencies import require_roles


router = APIRouter(
    prefix="/students",
    tags=["Students"]
)


# CREATE STUDENT
@router.post("/", response_model=StudentResponse)
def create_student(
    student: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Warden"))
):
    existing_student = db.query(Student).filter(
        Student.email == student.email
    ).first()

    if existing_student:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    # Validate user_id if provided
    if student.user_id is not None:
        user = db.query(User).filter(
            User.id == student.user_id
        ).first()

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        if user.role != "Student":
            raise HTTPException(
                status_code=400,
                detail="Only Student users can be linked to a student record"
            )

        existing_link = db.query(Student).filter(
            Student.user_id == student.user_id
        ).first()

        if existing_link:
            raise HTTPException(
                status_code=400,
                detail="This user is already linked to a student"
            )

    new_student = Student(
        name=student.name,
        email=student.email,
        phone=student.phone,
        course=student.course,
        year=student.year,
        room_number=student.room_number,
        user_id=student.user_id
    )

    db.add(new_student)

    try:
        db.commit()
        db.refresh(new_student)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Could not create student"
        )

    return new_student


# GET ALL STUDENTS
@router.get("/", response_model=list[StudentResponse])
def get_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Warden"))
):
    students = db.query(Student).all()
    return students


# GET STUDENT BY ID
@router.get("/{student_id}", response_model=StudentResponse)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Warden"))
):
    student = db.query(Student).filter(
        Student.id == student_id
    ).first()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    return student


# UPDATE STUDENT
@router.put("/{student_id}", response_model=StudentResponse)
def update_student(
    student_id: int,
    student_data: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Warden"))
):
    student = db.query(Student).filter(
        Student.id == student_id
    ).first()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    existing_email = db.query(Student).filter(
        Student.email == student_data.email,
        Student.id != student_id
    ).first()

    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    # Validate user_id if provided
    if student_data.user_id is not None:
        user = db.query(User).filter(
            User.id == student_data.user_id
        ).first()

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        if user.role != "Student":
            raise HTTPException(
                status_code=400,
                detail="Only Student users can be linked to a student record"
            )

        existing_link = db.query(Student).filter(
            Student.user_id == student_data.user_id,
            Student.id != student_id
        ).first()

        if existing_link:
            raise HTTPException(
                status_code=400,
                detail="This user is already linked to another student"
            )

    student.name = student_data.name
    student.email = student_data.email
    student.phone = student_data.phone
    student.course = student_data.course
    student.year = student_data.year
    student.room_number = student_data.room_number
    student.user_id = student_data.user_id

    try:
        db.commit()
        db.refresh(student)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Could not update student"
        )

    return student


# DELETE STUDENT
@router.delete("/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Warden"))
):
    student = db.query(Student).filter(
        Student.id == student_id
    ).first()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    db.delete(student)
    db.commit()

    return {
        "message": "Student deleted successfully"
    }