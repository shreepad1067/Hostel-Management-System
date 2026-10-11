from io import BytesIO

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from fastapi.responses import (
    StreamingResponse,
)

from sqlalchemy.orm import Session

from database import get_db

from dependencies import (
    require_roles,
)

from models.fee import (
    Fee,
    PaymentTransaction,
)

from models.hostel_profile import (
    HostelProfile,
)

from models.student import Student

from models.user import User

from services.fee_receipt_service import (
    generate_fee_receipt_pdf,
)


router = APIRouter(
    prefix="/fee-receipts",
    tags=[
        "Fee Receipts",
    ],
)


# ======================================================
# STUDENT HELPER
# ======================================================

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
                "linked to this account."
            ),
        )


    return student


# ======================================================
# DIGITAL PDF RECEIPT
#
# Student:
#   Can download only own receipts.
#
# Admin/Warden:
#   Can download any paid receipt.
# ======================================================

@router.get(
    "/{transaction_id}/pdf",
)
def download_fee_receipt(
    transaction_id: int,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_roles(
            "Admin",
            "Warden",
            "Student",
        )
    ),
):

    transaction = (
        db.query(
            PaymentTransaction
        )
        .filter(
            PaymentTransaction.id
            == transaction_id
        )
        .first()
    )


    if not transaction:
        raise HTTPException(
            status_code=404,
            detail=(
                "Payment transaction "
                "not found."
            ),
        )


    # ==================================================
    # ONLY SUCCESSFUL PAYMENTS HAVE RECEIPTS
    # ==================================================

    if (
        str(
            transaction.status
        )
        .strip()
        .lower()
        != "paid"
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "A receipt is available "
                "only for successful "
                "payments."
            ),
        )


    if (
        not transaction
        .receipt_number
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "Receipt number is missing "
                "for this payment."
            ),
        )


    # ==================================================
    # STUDENT
    # ==================================================

    if (
        current_user.role
        == "Student"
    ):

        student = (
            get_student_for_user(
                db,
                current_user,
            )
        )


        if (
            transaction.student_id
            != student.id
        ):
            raise HTTPException(
                status_code=403,
                detail=(
                    "You cannot access "
                    "another student's "
                    "payment receipt."
                ),
            )


    # ==================================================
    # ADMIN / WARDEN
    # ==================================================

    else:

        student = (
            db.query(Student)
            .filter(
                Student.id
                == transaction
                .student_id
            )
            .first()
        )


        if not student:
            raise HTTPException(
                status_code=404,
                detail=(
                    "Student record "
                    "not found."
                ),
            )


    # ==================================================
    # FEE
    # ==================================================

    fee = (
        db.query(Fee)
        .filter(
            Fee.id
            == transaction
            .fee_id
        )
        .first()
    )


    if not fee:
        raise HTTPException(
            status_code=404,
            detail=(
                "Fee record not found."
            ),
        )


    # ==================================================
    # HOSTEL PROFILE
    # ==================================================

    hostel = (
        db.query(
            HostelProfile
        )
        .filter(
            HostelProfile.id
            == 1
        )
        .first()
    )


    # ==================================================
    # GENERATE PDF
    # ==================================================

    pdf_bytes = (
        generate_fee_receipt_pdf(
            hostel=
                hostel,

            student=
                student,

            fee=
                fee,

            transaction=
                transaction,
        )
    )


    filename = (
        f"{transaction.receipt_number}.pdf"
    )


    return StreamingResponse(
        BytesIO(
            pdf_bytes
        ),

        media_type=
            "application/pdf",

        headers={
            "Content-Disposition":
                (
                    "attachment; "
                    f'filename="{filename}"'
                ),

            "Cache-Control":
                "no-store",
        },
    )