from datetime import (
    date,
    datetime,
    timezone,
)

import secrets

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy.orm import Session

from database import get_db

from dependencies import (
    require_roles,
)

from models.student import Student

from models.user import User

from models.visitor import Visitor

from schemas.visitor import (
    VisitorCreate,
    VisitorResponse,
    VisitorReview,
    VisitorScanRequest,
    VisitorScanResponse,
    VisitorUpdate,
)

from services.in_app_notification_service import (
    create_role_notifications,
    create_student_notification,
)


router = APIRouter(
    prefix="/visitors",
    tags=[
        "Visitors",
    ],
)


def utc_now():
    return (
        datetime.now(timezone.utc)
        .replace(tzinfo=None)
    )


# =====================================================
# HELPERS
# =====================================================

def get_student_for_user(
    db: Session,
    current_user: User,
) -> Student:

    student = (
        db.query(Student)
        .filter(
            Student.user_id
            == current_user.id
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail=(
                "Student profile is not "
                "linked to this user"
            ),
        )

    return student


def clean_optional_text(
    value: str | None,
) -> str | None:

    if not value:
        return None

    cleaned = value.strip()

    return (
        cleaned
        if cleaned
        else None
    )


def generate_unique_qr_code(
    db: Session,
) -> str:

    while True:

        qr_code = (
            "HHP_"
            + secrets.token_urlsafe(
                32
            )
        )

        exists = (
            db.query(Visitor)
            .filter(
                Visitor.qr_code
                == qr_code
            )
            .first()
        )

        if not exists:
            return qr_code


def visitor_response(
    db: Session,
    visitor: Visitor,
) -> dict:

    student = (
        db.query(Student)
        .filter(
            Student.id
            == visitor.student_id
        )
        .first()
    )

    approver = None

    if (
        visitor.approved_by_user_id
    ):
        approver = (
            db.query(User)
            .filter(
                User.id
                == visitor
                .approved_by_user_id
            )
            .first()
        )


    pass_available = (
        bool(
            visitor.qr_code
        )
        and
        visitor.status
        in [
            "Approved",
            "Checked In",
        ]
    )


    return {
        "id":
            visitor.id,

        "student_id":
            visitor.student_id,

        "student_name":
            (
                student.name
                if student
                else None
            ),

        "student_code":
            (
                student.student_code
                if student
                else None
            ),

        "visitor_name":
            visitor.visitor_name,

        "relation":
            visitor.relation,

        "phone":
            visitor.phone,

        "purpose":
            visitor.purpose,

        "visit_date":
            visitor.visit_date,

        "check_in":
            visitor.check_in,

        "check_out":
            visitor.check_out,

        "status":
            visitor.status,

        "remarks":
            visitor.remarks,

        "qr_code":
            visitor.qr_code,

        "approved_at":
            visitor.approved_at,

        "approved_by_user_id":
            visitor
            .approved_by_user_id,

        "approved_by_name":
            (
                (
                    approver.full_name
                    or approver.username
                )
                if approver
                else None
            ),

        "created_at":
            visitor.created_at,

        "pass_available":
            pass_available,
    }


def validate_visit_times(
    check_in: datetime | None,
    check_out: datetime | None,
):

    if (
        check_in
        and
        check_out
        and
        check_out < check_in
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Check-out time cannot "
                "be before check-in time"
            ),
        )


# =====================================================
# STUDENT — CREATE VISITOR REQUEST
# =====================================================

@router.post(
    "/my-visitor",
    response_model=
        VisitorResponse,
)
def create_my_visitor(
    visitor: VisitorCreate,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_roles(
            "Student"
        )
    ),
):

    student = (
        get_student_for_user(
            db,
            current_user,
        )
    )


    visit_date = (
        visitor.visit_date
        or date.today()
    )


    if (
        visit_date <
        date.today()
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Visit date cannot "
                "be in the past"
            ),
        )


    new_visitor = Visitor(
        student_id=
            student.id,

        visitor_name=
            visitor
            .visitor_name
            .strip(),

        relation=
            visitor
            .relation
            .strip(),

        phone=
            visitor
            .phone
            .strip(),

        purpose=
            visitor
            .purpose
            .strip(),

        visit_date=
            visit_date,

        check_in=
            None,

        check_out=
            None,

        status=
            "Pending",

        remarks=
            clean_optional_text(
                visitor.remarks
            ),
    )


    db.add(
        new_visitor
    )

    db.flush()


    create_role_notifications(
        db=db,

        roles=[
            "Admin",
            "Warden",
        ],

        title=
            "New visitor request",

        message=(
            f"{student.name} requested "
            f"a visitor pass for "
            f"{new_visitor.visitor_name} "
            f"on {visit_date}."
        ),

        category=
            "Visitor",

        level=
            "Info",

        link=
            "/visitors",
    )


    db.commit()

    db.refresh(
        new_visitor
    )


    return visitor_response(
        db,
        new_visitor,
    )


# =====================================================
# ADMIN/WARDEN — CREATE VISITOR RECORD
# =====================================================

@router.post(
    "/",
    response_model=
        VisitorResponse,
)
def create_visitor(
    visitor: VisitorCreate,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_roles(
            "Admin",
            "Warden",
        )
    ),
):

    if (
        visitor.student_id
        is None
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Student is required"
            ),
        )


    student = (
        db.query(Student)
        .filter(
            Student.id
            == visitor.student_id
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail=(
                "Student not found"
            ),
        )


    visit_date = (
        visitor.visit_date
        or date.today()
    )


    validate_visit_times(
        visitor.check_in,
        visitor.check_out,
    )


    status = (
        visitor.status
        or "Pending"
    )


    qr_code = None
    approved_at = None
    approved_by_user_id = None


    if (
        status ==
        "Approved"
    ):

        qr_code = (
            generate_unique_qr_code(
                db
            )
        )

        approved_at = (
            utc_now()
        )

        approved_by_user_id = (
            current_user.id
        )


    new_visitor = Visitor(
        student_id=
            student.id,

        visitor_name=
            visitor
            .visitor_name
            .strip(),

        relation=
            visitor
            .relation
            .strip(),

        phone=
            visitor
            .phone
            .strip(),

        purpose=
            visitor
            .purpose
            .strip(),

        visit_date=
            visit_date,

        check_in=
            visitor.check_in,

        check_out=
            visitor.check_out,

        status=
            status,

        remarks=
            clean_optional_text(
                visitor.remarks
            ),

        qr_code=
            qr_code,

        approved_at=
            approved_at,

        approved_by_user_id=
            approved_by_user_id,
    )


    db.add(
        new_visitor
    )

    db.flush()


    if (
        status ==
        "Approved"
    ):

        create_student_notification(
            db=db,

            student_id=
                student.id,

            title=
                "Visitor pass approved",

            message=(
                f"Visitor pass for "
                f"{new_visitor.visitor_name} "
                f"has been approved for "
                f"{visit_date}."
            ),

            category=
                "Visitor",

            level=
                "Success",

            link=
                "/visitors",
        )


    db.commit()

    db.refresh(
        new_visitor
    )


    return visitor_response(
        db,
        new_visitor,
    )


# =====================================================
# STUDENT — GET MY VISITORS
# =====================================================

@router.get(
    "/my-visitors",
    response_model=
        list[
            VisitorResponse
        ],
)
def get_my_visitors(
    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_roles(
            "Student"
        )
    ),
):

    student = (
        get_student_for_user(
            db,
            current_user,
        )
    )


    visitors = (
        db.query(Visitor)
        .filter(
            Visitor.student_id
            == student.id
        )
        .order_by(
            Visitor.id.desc()
        )
        .all()
    )


    return [
        visitor_response(
            db,
            visitor,
        )
        for visitor in visitors
    ]


# =====================================================
# ADMIN/WARDEN — GET ALL VISITORS
# =====================================================

@router.get(
    "/",
    response_model=
        list[
            VisitorResponse
        ],
)
def get_visitors(
    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_roles(
            "Admin",
            "Warden",
        )
    ),
):

    visitors = (
        db.query(Visitor)
        .order_by(
            Visitor.id.desc()
        )
        .all()
    )


    return [
        visitor_response(
            db,
            visitor,
        )
        for visitor in visitors
    ]


# =====================================================
# FEATURE 6 — QR PASS SCANNER
#
# First successful scan:
# Approved -> Checked In
#
# Second successful scan:
# Checked In -> Completed
# =====================================================

@router.post(
    "/scan-pass",
    response_model=
        VisitorScanResponse,
)
def scan_visitor_pass(
    payload: VisitorScanRequest,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_roles(
            "Admin",
            "Warden",
        )
    ),
):

    qr_code = (
        payload
        .qr_code
        .strip()
    )


    visitor = (
        db.query(Visitor)
        .filter(
            Visitor.qr_code
            == qr_code
        )
        .with_for_update()
        .first()
    )


    if not visitor:
        raise HTTPException(
            status_code=404,
            detail=(
                "Invalid visitor QR pass"
            ),
        )


    today = (
        date.today()
    )


    if (
        visitor.visit_date
        != today
    ):

        if (
            visitor.visit_date
            > today
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "This visitor pass is "
                    "not valid yet"
                ),
            )

        raise HTTPException(
            status_code=400,
            detail=(
                "This visitor pass "
                "has expired"
            ),
        )


    # -------------------------------------------------
    # CHECK IN
    # -------------------------------------------------

    if (
        visitor.status ==
        "Approved"
    ):

        visitor.check_in = (
            utc_now()
        )

        visitor.status = (
            "Checked In"
        )


        create_student_notification(
            db=db,

            student_id=
                visitor.student_id,

            title=
                "Visitor checked in",

            message=(
                f"{visitor.visitor_name} "
                f"has checked in to "
                f"the hostel."
            ),

            category=
                "Visitor",

            level=
                "Info",

            link=
                "/visitors",
        )


        db.commit()

        db.refresh(
            visitor
        )


        return {
            "action":
                "Check In",

            "message":
                (
                    f"{visitor.visitor_name} "
                    f"checked in successfully."
                ),

            "visitor":
                visitor_response(
                    db,
                    visitor,
                ),
        }


    # -------------------------------------------------
    # CHECK OUT
    # -------------------------------------------------

    if (
        visitor.status ==
        "Checked In"
    ):

        visitor.check_out = (
            utc_now()
        )

        visitor.status = (
            "Completed"
        )


        create_student_notification(
            db=db,

            student_id=
                visitor.student_id,

            title=
                "Visitor checked out",

            message=(
                f"{visitor.visitor_name} "
                f"has checked out from "
                f"the hostel."
            ),

            category=
                "Visitor",

            level=
                "Success",

            link=
                "/visitors",
        )


        db.commit()

        db.refresh(
            visitor
        )


        return {
            "action":
                "Check Out",

            "message":
                (
                    f"{visitor.visitor_name} "
                    f"checked out successfully."
                ),

            "visitor":
                visitor_response(
                    db,
                    visitor,
                ),
        }


    # -------------------------------------------------
    # INVALID STATUS
    # -------------------------------------------------

    if (
        visitor.status ==
        "Pending"
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Visitor request has not "
                "been approved yet"
            ),
        )


    if (
        visitor.status ==
        "Rejected"
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Visitor pass was rejected"
            ),
        )


    if (
        visitor.status ==
        "Cancelled"
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Visitor request was cancelled"
            ),
        )


    if (
        visitor.status ==
        "Completed"
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "This visitor visit "
                "has already been completed"
            ),
        )


    raise HTTPException(
        status_code=400,
        detail=(
            "Visitor QR pass cannot "
            "be used in its current status"
        ),
    )


# =====================================================
# ADMIN/WARDEN — APPROVE / REJECT VISITOR
# =====================================================

@router.put(
    "/{visitor_id}/review",
    response_model=
        VisitorResponse,
)
def review_visitor(
    visitor_id: int,

    payload: VisitorReview,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_roles(
            "Admin",
            "Warden",
        )
    ),
):

    visitor = (
        db.query(Visitor)
        .filter(
            Visitor.id
            == visitor_id
        )
        .with_for_update()
        .first()
    )


    if not visitor:
        raise HTTPException(
            status_code=404,
            detail=(
                "Visitor record not found"
            ),
        )


    if (
        visitor.status
        not in [
            "Pending",
            "Expected",
        ]
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "This visitor request "
                "has already been reviewed"
            ),
        )


    remarks = (
        clean_optional_text(
            payload.remarks
        )
    )


    # -------------------------------------------------
    # REJECT
    # -------------------------------------------------

    if (
        payload.decision ==
        "Rejected"
    ):

        visitor.status = (
            "Rejected"
        )

        visitor.remarks = (
            remarks
            if remarks is not None
            else visitor.remarks
        )

        visitor.qr_code = (
            None
        )

        visitor.approved_at = (
            None
        )

        visitor.approved_by_user_id = (
            current_user.id
        )


        create_student_notification(
            db=db,

            student_id=
                visitor.student_id,

            title=
                "Visitor request rejected",

            message=(
                f"Visitor request for "
                f"{visitor.visitor_name} "
                f"on {visitor.visit_date} "
                f"was not approved."
                + (
                    f" Note: {remarks}"
                    if remarks
                    else ""
                )
            ),

            category=
                "Visitor",

            level=
                "Info",

            link=
                "/visitors",
        )


        db.commit()

        db.refresh(
            visitor
        )


        return visitor_response(
            db,
            visitor,
        )


    # -------------------------------------------------
    # APPROVE
    # -------------------------------------------------

    if (
        visitor.visit_date <
        date.today()
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Cannot approve a visitor "
                "request for a past date"
            ),
        )


    visitor.status = (
        "Approved"
    )

    visitor.remarks = (
        remarks
        if remarks is not None
        else visitor.remarks
    )

    visitor.qr_code = (
        visitor.qr_code
        or generate_unique_qr_code(
            db
        )
    )

    visitor.approved_at = (
        utc_now()
    )

    visitor.approved_by_user_id = (
        current_user.id
    )


    create_student_notification(
        db=db,

        student_id=
            visitor.student_id,

        title=
            "Visitor pass approved",

        message=(
            f"Visitor pass for "
            f"{visitor.visitor_name} "
            f"has been approved for "
            f"{visitor.visit_date}. "
            f"The QR pass is now available."
        ),

        category=
            "Visitor",

        level=
            "Success",

        link=
            "/visitors",
    )


    db.commit()

    db.refresh(
        visitor
    )


    return visitor_response(
        db,
        visitor,
    )


# =====================================================
# STUDENT — CANCEL PENDING VISITOR REQUEST
# =====================================================

@router.delete(
    "/{visitor_id}/cancel-my-request",
    response_model=
        VisitorResponse,
)
def cancel_my_visitor_request(
    visitor_id: int,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_roles(
            "Student"
        )
    ),
):

    student = (
        get_student_for_user(
            db,
            current_user,
        )
    )


    visitor = (
        db.query(Visitor)
        .filter(
            Visitor.id
            == visitor_id,

            Visitor.student_id
            == student.id,
        )
        .with_for_update()
        .first()
    )


    if not visitor:
        raise HTTPException(
            status_code=404,
            detail=(
                "Visitor request not found"
            ),
        )


    if (
        visitor.status
        not in [
            "Pending",
            "Approved",
        ]
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "This visitor request "
                "can no longer be cancelled"
            ),
        )


    if (
        visitor.check_in
        is not None
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "A checked-in visitor "
                "cannot be cancelled"
            ),
        )


    visitor.status = (
        "Cancelled"
    )

    visitor.qr_code = (
        None
    )


    create_role_notifications(
        db=db,

        roles=[
            "Admin",
            "Warden",
        ],

        title=
            "Visitor request cancelled",

        message=(
            f"{student.name} cancelled "
            f"the visitor request for "
            f"{visitor.visitor_name}."
        ),

        category=
            "Visitor",

        level=
            "Info",

        link=
            "/visitors",
    )


    db.commit()

    db.refresh(
        visitor
    )


    return visitor_response(
        db,
        visitor,
    )


# =====================================================
# ADMIN/WARDEN — GET VISITOR BY ID
# =====================================================

@router.get(
    "/{visitor_id}",
    response_model=
        VisitorResponse,
)
def get_visitor(
    visitor_id: int,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_roles(
            "Admin",
            "Warden",
        )
    ),
):

    visitor = (
        db.query(Visitor)
        .filter(
            Visitor.id
            == visitor_id
        )
        .first()
    )


    if not visitor:
        raise HTTPException(
            status_code=404,
            detail=(
                "Visitor record not found"
            ),
        )


    return visitor_response(
        db,
        visitor,
    )


# =====================================================
# ADMIN/WARDEN — UPDATE VISITOR
# =====================================================

@router.put(
    "/{visitor_id}",
    response_model=
        VisitorResponse,
)
def update_visitor(
    visitor_id: int,

    visitor_data: VisitorUpdate,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_roles(
            "Admin",
            "Warden",
        )
    ),
):

    visitor = (
        db.query(Visitor)
        .filter(
            Visitor.id
            == visitor_id
        )
        .with_for_update()
        .first()
    )


    if not visitor:
        raise HTTPException(
            status_code=404,
            detail=(
                "Visitor record not found"
            ),
        )


    update_data = (
        visitor_data.model_dump(
            exclude_unset=True
        )
    )


    # -------------------------------------------------
    # STUDENT
    # -------------------------------------------------

    if (
        "student_id"
        in update_data
    ):

        student_id = (
            update_data[
                "student_id"
            ]
        )

        if student_id is None:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Student cannot be empty"
                ),
            )


        student = (
            db.query(Student)
            .filter(
                Student.id
                == student_id
            )
            .first()
        )

        if not student:
            raise HTTPException(
                status_code=404,
                detail=(
                    "Student not found"
                ),
            )


    # -------------------------------------------------
    # CLEAN TEXT
    # -------------------------------------------------

    for field in [
        "visitor_name",
        "relation",
        "phone",
        "purpose",
    ]:

        if (
            field in update_data
            and
            update_data[field]
            is not None
        ):
            update_data[field] = (
                update_data[
                    field
                ].strip()
            )


    if (
        "remarks"
        in update_data
    ):
        update_data["remarks"] = (
            clean_optional_text(
                update_data[
                    "remarks"
                ]
            )
        )


    # -------------------------------------------------
    # TIME VALIDATION
    # -------------------------------------------------

    future_check_in = (
        update_data.get(
            "check_in",
            visitor.check_in,
        )
    )

    future_check_out = (
        update_data.get(
            "check_out",
            visitor.check_out,
        )
    )


    validate_visit_times(
        future_check_in,
        future_check_out,
    )


    previous_status = (
        visitor.status
    )


    for (
        field,
        value,
    ) in update_data.items():

        setattr(
            visitor,
            field,
            value,
        )


    # -------------------------------------------------
    # STATUS -> QR LOGIC
    # -------------------------------------------------

    if (
        visitor.status ==
        "Approved"
    ):

        if not visitor.qr_code:
            visitor.qr_code = (
                generate_unique_qr_code(
                    db
                )
            )

        if not visitor.approved_at:
            visitor.approved_at = (
                utc_now()
            )

        visitor.approved_by_user_id = (
            current_user.id
        )


    if (
        visitor.status
        in [
            "Rejected",
            "Cancelled",
        ]
    ):
        visitor.qr_code = (
            None
        )


    # -------------------------------------------------
    # STUDENT STATUS NOTIFICATION
    # -------------------------------------------------

    if (
        previous_status
        != visitor.status
    ):

        create_student_notification(
            db=db,

            student_id=
                visitor.student_id,

            title=
                "Visitor status updated",

            message=(
                f"Visitor request for "
                f"{visitor.visitor_name} "
                f"is now "
                f"{visitor.status}."
            ),

            category=
                "Visitor",

            level=(
                "Success"
                if visitor.status
                in [
                    "Approved",
                    "Completed",
                ]
                else "Info"
            ),

            link=
                "/visitors",
        )


    db.commit()

    db.refresh(
        visitor
    )


    return visitor_response(
        db,
        visitor,
    )


# =====================================================
# ADMIN/WARDEN — DELETE VISITOR RECORD
# =====================================================

@router.delete(
    "/{visitor_id}"
)
def delete_visitor(
    visitor_id: int,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_roles(
            "Admin",
            "Warden",
        )
    ),
):

    visitor = (
        db.query(Visitor)
        .filter(
            Visitor.id
            == visitor_id
        )
        .first()
    )


    if not visitor:
        raise HTTPException(
            status_code=404,
            detail=(
                "Visitor record not found"
            ),
        )


    if (
        visitor.status ==
        "Checked In"
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "A checked-in visitor "
                "cannot be deleted"
            ),
        )


    db.delete(
        visitor
    )

    db.commit()


    return {
        "message":
            (
                "Visitor record "
                "deleted successfully"
            )
    }