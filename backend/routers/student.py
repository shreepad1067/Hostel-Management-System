from datetime import date

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


# CREATE STUDENT / ADMISSION
@router.post("/", response_model=StudentResponse)
def create_student(
    student: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin"))
):
    if student.room_number:
        raise HTTPException(status_code=400, detail="Use room allocation after admission to assign a room")

    existing_student = db.query(Student).filter(
        Student.email == student.email
    ).first()

    if existing_student:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

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
        student_code=None,
        name=student.name,
        email=student.email,
        phone=student.phone,
        course=student.course,
        year=student.year,
        room_number=student.room_number,
        guardian_phone=student.guardian_phone,
        parent_name=student.parent_name,
        parent_email=student.parent_email,
        emergency_contact=student.emergency_contact,
        address=student.address,
        room_preference=student.room_preference,
        admission_status=student.admission_status,
        admission_date=student.admission_date or date.today(),
        user_id=student.user_id
    )

    db.add(new_student)

    try:
        db.flush()

        current_year = date.today().year

        new_student.student_code = (
            f"HMS{current_year}{new_student.id:05d}"
        )

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
    current_user: User = Depends(
        require_roles("Admin", "Warden")
    )
):
    return db.query(Student).all()


# LOOKUP STUDENT USING HOSTELHUB STUDENT ID
@router.get(
    "/by-code/{student_code}",
    response_model=StudentResponse
)
def get_student_by_code(
    student_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin", "Warden")
    )
):
    normalized_code = student_code.strip().upper()

    student = db.query(Student).filter(
        Student.student_code == normalized_code
    ).first()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    return student


# GET STUDENT BY DATABASE ID
@router.get("/{student_id}", response_model=StudentResponse)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin", "Warden")
    )
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
    current_user: User = Depends(
        require_roles("Admin", "Warden")
    )
):
    student = db.query(Student).filter(
        Student.id == student_id
    ).with_for_update().first()

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

    if student_data.user_id != student.user_id:
        raise HTTPException(status_code=400, detail="Login links cannot be changed here; use the student account workflow")
    if student_data.room_number != student.room_number:
        raise HTTPException(status_code=400, detail="Use room allocation to change the assigned room")

    student.name = student_data.name
    student.email = student_data.email
    student.phone = student_data.phone
    student.course = student_data.course
    student.year = student_data.year
    student.room_number = student_data.room_number
    student.guardian_phone = student_data.guardian_phone
    student.parent_name = student_data.parent_name
    student.parent_email = student_data.parent_email
    student.emergency_contact = student_data.emergency_contact
    student.address = student_data.address
    student.room_preference = student_data.room_preference
    student.admission_status = student_data.admission_status
    student.admission_date = student_data.admission_date
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
    current_user: User = Depends(require_roles("Admin"))
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