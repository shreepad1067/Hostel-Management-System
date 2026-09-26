import re

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy.exc import (
    IntegrityError,
)

from sqlalchemy.orm import Session

from database import get_db

from dependencies import (
    require_roles,
)

from auth import (
    hash_password,
)

from models.user import User
from models.student import Student

from schemas.account_management import (
    StudentProvisionRequest,
    WardenProvisionRequest,
    AccountProvisionResponse,
    AccountUserSummary,
    StudentAccountStatus,
    AccountOverviewResponse,
)

from services.account_service import (
    generate_temporary_password,
    send_account_credentials_email,
)


router = APIRouter(
    prefix="/accounts",
    tags=["Account Management"],
)


USERNAME_PATTERN = re.compile(
    r"^[A-Za-z0-9._-]{3,50}$"
)


def normalize_email(
    value: str,
) -> str:
    email = (
        value
        .strip()
        .lower()
    )

    if (
        not email
        or "@" not in email
        or "." not in email
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "A valid email address "
                "is required."
            ),
        )

    return email


def normalize_phone(
    value: str,
) -> str:
    phone = (
        value
        .strip()
        .replace(" ", "")
        .replace("-", "")
    )

    if phone.startswith("+91"):
        local_number = phone[3:]

    elif phone.startswith("91") and len(
        phone
    ) == 12:
        local_number = phone[2:]

    else:
        local_number = phone

    if (
        not local_number.isdigit()
        or len(local_number) != 10
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Enter a valid "
                "10-digit phone number."
            ),
        )

    return local_number


def validate_username(
    username: str,
) -> str:
    value = username.strip()

    if not USERNAME_PATTERN.fullmatch(
        value
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Username must contain "
                "3 to 50 characters and "
                "can use letters, numbers, "
                "dot, underscore or hyphen."
            ),
        )

    return value


def username_exists(
    db: Session,
    username: str,
) -> bool:
    return (
        db.query(User)
        .filter(
            User.username
            == username
        )
        .first()
        is not None
    )


def email_exists(
    db: Session,
    email: str,
) -> bool:
    return (
        db.query(User)
        .filter(
            User.email
            == email
        )
        .first()
        is not None
    )


def phone_exists(
    db: Session,
    phone: str,
) -> bool:
    return (
        db.query(User)
        .filter(
            User.phone_number
            == phone
        )
        .first()
        is not None
    )


def create_unique_username(
    db: Session,
    base_username: str,
) -> str:
    cleaned = re.sub(
        r"[^A-Za-z0-9._-]",
        "",
        base_username,
    )

    cleaned = cleaned[:40]

    if len(cleaned) < 3:
        cleaned = (
            f"user{cleaned}"
        )

    if not username_exists(
        db,
        cleaned,
    ):
        return cleaned

    counter = 2

    while counter <= 9999:
        candidate = (
            f"{cleaned}_{counter}"
        )

        if not username_exists(
            db,
            candidate,
        ):
            return candidate

        counter += 1

    raise HTTPException(
        status_code=409,
        detail=(
            "Unable to generate "
            "a unique username."
        ),
    )


@router.get(
    "/overview",
    response_model=(
        AccountOverviewResponse
    ),
)
def get_account_overview(
    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_roles("Admin")
    ),
):
    students = (
        db.query(Student)
        .filter(
            Student.admission_status
            == "Admitted"
        )
        .order_by(
            Student.id.desc()
        )
        .all()
    )

    wardens = (
        db.query(User)
        .filter(
            User.role == "Warden"
        )
        .order_by(
            User.id.desc()
        )
        .all()
    )

    student_records = []

    linked_count = 0

    for student in students:
        linked_user = None

        if student.user_id:
            linked_user = (
                db.query(User)
                .filter(
                    User.id
                    == student.user_id
                )
                .first()
            )

        if linked_user:
            linked_count += 1

        student_records.append(
            StudentAccountStatus(
                student_id=student.id,

                student_code=(
                    student.student_code
                ),

                name=student.name,

                email=student.email,

                phone=student.phone,

                course=student.course,

                year=student.year,

                admission_status=(
                    student.admission_status
                ),

                account_id=(
                    linked_user.id
                    if linked_user
                    else None
                ),

                username=(
                    linked_user.username
                    if linked_user
                    else None
                ),

                has_account=(
                    linked_user
                    is not None
                ),
            )
        )

    return AccountOverviewResponse(
        admitted_students=(
            len(students)
        ),

        linked_student_accounts=(
            linked_count
        ),

        pending_student_accounts=(
            len(students)
            - linked_count
        ),

        total_wardens=(
            len(wardens)
        ),

        students=student_records,

        wardens=[
            AccountUserSummary(
                id=warden.id,

                username=(
                    warden.username
                ),

                email=(
                    warden.email
                ),

                phone_number=(
                    warden.phone_number
                ),

                full_name=(
                    warden.full_name
                ),

                role=warden.role,

                is_active=(
                    warden.is_active
                ),
            )
            for warden
            in wardens
        ],
    )


@router.post(
    "/student",
    response_model=(
        AccountProvisionResponse
    ),
    status_code=(
        status.HTTP_201_CREATED
    ),
)
def provision_student_account(
    payload: StudentProvisionRequest,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_roles("Admin")
    ),
):
    student_code = (
        payload.student_code
        .strip()
        .upper()
    )

    if not student_code:
        raise HTTPException(
            status_code=400,
            detail=(
                "Student ID is required."
            ),
        )

    student = (
        db.query(Student)
        .filter(
            Student.student_code
            == student_code
        )
        .first()
    )

    if student is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "Student admission "
                "record not found."
            ),
        )

    if (
        student.admission_status
        != "Admitted"
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "The student must be "
                "admitted before an "
                "account can be created."
            ),
        )

    if student.user_id:
        raise HTTPException(
            status_code=409,
            detail=(
                "This student already "
                "has a HostelHub account."
            ),
        )

    email = normalize_email(
        student.email
    )

    phone = normalize_phone(
        student.phone
    )

    if email_exists(
        db,
        email,
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "The student's email is "
                "already linked to another "
                "HostelHub account."
            ),
        )

    if phone_exists(
        db,
        phone,
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "The student's phone "
                "number is already linked "
                "to another account."
            ),
        )

    if (
        payload.username
        and payload.username.strip()
    ):
        username = validate_username(
            payload.username
        )

        if username_exists(
            db,
            username,
        ):
            raise HTTPException(
                status_code=409,
                detail=(
                    "Username already exists."
                ),
            )

    else:
        username = (
            create_unique_username(
                db,
                student_code.lower(),
            )
        )

    temporary_password = (
        generate_temporary_password()
    )

    new_user = User(
        username=username,

        email=email,

        phone_number=phone,

        full_name=student.name,

        hashed_password=(
            hash_password(
                temporary_password
            )
        ),

        role="Student",

        is_active=True,
    )

    try:
        db.add(new_user)

        db.flush()

        student.user_id = (
            new_user.id
        )

        send_account_credentials_email(
            recipient_email=email,

            recipient_name=student.name,

            username=username,

            temporary_password=(
                temporary_password
            ),

            role="Student",
        )

        db.commit()

        db.refresh(new_user)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail=(
                "Account could not be "
                "created because one of "
                "the account details "
                "already exists."
            ),
        )

    except HTTPException:
        db.rollback()
        raise

    except Exception as exc:
        db.rollback()

        print(
            "Student account provisioning "
            f"email failed: {exc}"
        )

        raise HTTPException(
            status_code=503,
            detail=(
                "The account was not created "
                "because the temporary "
                "credentials could not be "
                "delivered by email."
            ),
        )

    return AccountProvisionResponse(
        message=(
            "Student account created and "
            "temporary credentials were "
            "sent to the registered email."
        ),

        username=username,

        email=email,

        role="Student",

        credentials_sent=True,
    )


@router.post(
    "/warden",
    response_model=(
        AccountProvisionResponse
    ),
    status_code=(
        status.HTTP_201_CREATED
    ),
)
def provision_warden_account(
    payload: WardenProvisionRequest,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_roles("Admin")
    ),
):
    full_name = (
        payload.full_name
        .strip()
    )

    if len(full_name) < 2:
        raise HTTPException(
            status_code=400,
            detail=(
                "Warden full name "
                "is required."
            ),
        )

    email = normalize_email(
        payload.email
    )

    phone = normalize_phone(
        payload.phone_number
    )

    if email_exists(
        db,
        email,
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "Email address is already "
                "linked to a HostelHub account."
            ),
        )

    if phone_exists(
        db,
        phone,
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "Phone number is already "
                "linked to a HostelHub account."
            ),
        )

    if (
        payload.username
        and payload.username.strip()
    ):
        username = validate_username(
            payload.username
        )

        if username_exists(
            db,
            username,
        ):
            raise HTTPException(
                status_code=409,
                detail=(
                    "Username already exists."
                ),
            )

    else:
        base_username = (
            email
            .split("@")[0]
        )

        username = (
            create_unique_username(
                db,
                base_username,
            )
        )

    temporary_password = (
        generate_temporary_password()
    )

    new_user = User(
        username=username,

        email=email,

        phone_number=phone,

        full_name=full_name,

        hashed_password=(
            hash_password(
                temporary_password
            )
        ),

        role="Warden",

        is_active=True,
    )

    try:
        db.add(new_user)

        db.flush()

        send_account_credentials_email(
            recipient_email=email,

            recipient_name=full_name,

            username=username,

            temporary_password=(
                temporary_password
            ),

            role="Warden",
        )

        db.commit()

        db.refresh(new_user)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail=(
                "Warden account could "
                "not be created because "
                "one of the account "
                "details already exists."
            ),
        )

    except HTTPException:
        db.rollback()
        raise

    except Exception as exc:
        db.rollback()

        print(
            "Warden account provisioning "
            f"email failed: {exc}"
        )

        raise HTTPException(
            status_code=503,
            detail=(
                "The Warden account was "
                "not created because the "
                "temporary credentials "
                "could not be delivered "
                "by email."
            ),
        )

    return AccountProvisionResponse(
        message=(
            "Warden account created and "
            "temporary credentials were "
            "sent to the registered email."
        ),

        username=username,

        email=email,

        role="Warden",

        credentials_sent=True,
    )