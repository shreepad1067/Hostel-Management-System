from datetime import (
    datetime,
    timezone,
)

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy.orm import Session

from database import get_db
from dependencies import require_roles

from models.fee import (
    Fee,
    PaymentSettings,
    PaymentTransaction,
)

from models.student import Student
from models.user import User

from schemas.fee import (
    FeeCreate,
    FeeResponse,
    FeeUpdate,
    PaymentFailureRequest,
    PaymentSettingsResponse,
    PaymentSettingsUpdate,
    PaymentStartResponse,
    PaymentTransactionResponse,
)


router = APIRouter(
    prefix="/fees",
    tags=["Fees"],
)


def get_student_for_user(
    db: Session,
    user: User,
) -> Student:
    student = (
        db.query(Student)
        .filter(
            Student.user_id
            == user.id
        )
        .first()
    )

    if student is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "No student profile is "
                "linked to this account."
            ),
        )

    return student


def get_payment_settings(
    db: Session,
) -> PaymentSettings:
    settings = (
        db.query(PaymentSettings)
        .filter(
            PaymentSettings.id == 1
        )
        .first()
    )

    if settings:
        return settings

    settings = PaymentSettings(
        id=1,
        payment_enabled=True,
    )

    db.add(settings)
    db.commit()
    db.refresh(settings)

    return settings


@router.get(
    "/payment-settings",
    response_model=PaymentSettingsResponse,
)
def payment_settings_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "Admin",
            "Warden",
            "Student",
        )
    ),
):
    return get_payment_settings(db)


@router.put(
    "/payment-settings",
    response_model=PaymentSettingsResponse,
)
def payment_settings_update(
    payload: PaymentSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin")
    ),
):
    settings = get_payment_settings(
        db
    )

    last4 = (
        payload.account_last4.strip()
        if payload.account_last4
        else None
    )

    if (
        last4
        and (
            len(last4) != 4
            or not last4.isdigit()
        )
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Account last four digits "
                "must contain exactly four numbers."
            ),
        )

    settings.payment_enabled = (
        payload.payment_enabled
    )

    settings.account_holder_name = (
        payload.account_holder_name
    )

    settings.bank_name = (
        payload.bank_name
    )

    settings.account_last4 = last4

    settings.ifsc_code = (
        payload.ifsc_code
    )

    settings.upi_id = (
        payload.upi_id
    )

    settings.support_email = (
        payload.support_email
    )

    settings.failure_message = (
        payload.failure_message
    )

    settings.updated_by = (
        current_user.id
    )

    db.commit()
    db.refresh(settings)

    return settings


@router.get(
    "/my-fees",
    response_model=list[
        FeeResponse
    ],
)
def my_fees(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Student")
    ),
):
    student = get_student_for_user(
        db,
        current_user,
    )

    return (
        db.query(Fee)
        .filter(
            Fee.student_id
            == student.id
        )
        .order_by(
            Fee.due_date.desc()
        )
        .all()
    )


@router.get(
    "/my-payment-transactions",
    response_model=list[
        PaymentTransactionResponse
    ],
)
def my_payment_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Student")
    ),
):
    student = get_student_for_user(
        db,
        current_user,
    )

    return (
        db.query(PaymentTransaction)
        .filter(
            PaymentTransaction.student_id
            == student.id
        )
        .order_by(
            PaymentTransaction.id.desc()
        )
        .all()
    )


@router.get(
    "/payment-transactions",
    response_model=list[
        PaymentTransactionResponse
    ],
)
def payment_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "Admin",
            "Warden",
        )
    ),
):
    return (
        db.query(PaymentTransaction)
        .order_by(
            PaymentTransaction.id.desc()
        )
        .limit(500)
        .all()
    )


@router.post(
    "/payments/{fee_id}/start",
    response_model=PaymentStartResponse,
)
def start_payment(
    fee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Student")
    ),
):
    student = get_student_for_user(
        db,
        current_user,
    )

    settings = get_payment_settings(
        db
    )

    if not settings.payment_enabled:
        raise HTTPException(
            status_code=503,
            detail=(
                settings.failure_message
                or
                "Online payments are unavailable."
            ),
        )

    fee = (
        db.query(Fee)
        .filter(
            Fee.id == fee_id,
            Fee.student_id == student.id,
        )
        .first()
    )

    if fee is None:
        raise HTTPException(
            status_code=404,
            detail="Fee not found.",
        )

    if (
        str(fee.status)
        .strip()
        .lower()
        == "paid"
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "This fee has already been paid."
            ),
        )

    existing = (
        db.query(PaymentTransaction)
        .filter(
            PaymentTransaction.fee_id
            == fee.id,

            PaymentTransaction.student_id
            == student.id,

            PaymentTransaction.status
            == "Initiated",
        )
        .order_by(
            PaymentTransaction.id.desc()
        )
        .first()
    )

    if existing:
        transaction = existing

    else:
        transaction = PaymentTransaction(
            fee_id=fee.id,
            student_id=student.id,
            amount=fee.amount,
            status="Initiated",
            payment_method="Online Demo",
        )

        db.add(transaction)
        db.commit()
        db.refresh(transaction)

    return PaymentStartResponse(
        transaction_id=transaction.id,
        fee_id=transaction.fee_id,
        amount=float(
            transaction.amount
        ),
        mode="Demo/Test",
        status=transaction.status,
    )


@router.post(
    "/payments/{transaction_id}/complete-demo",
    response_model=PaymentTransactionResponse,
)
def complete_demo_payment(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Student")
    ),
):
    student = get_student_for_user(
        db,
        current_user,
    )

    transaction = (
        db.query(PaymentTransaction)
        .filter(
            PaymentTransaction.id
            == transaction_id,

            PaymentTransaction.student_id
            == student.id,
        )
        .first()
    )

    if transaction is None:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found.",
        )

    if transaction.status == "Paid":
        return transaction

    if transaction.status == "Failed":
        raise HTTPException(
            status_code=409,
            detail=(
                "This transaction already failed."
            ),
        )

    fee = (
        db.query(Fee)
        .filter(
            Fee.id
            == transaction.fee_id
        )
        .first()
    )

    if fee is None:
        raise HTTPException(
            status_code=404,
            detail="Fee not found.",
        )

    now = datetime.now(
        timezone.utc
    ).replace(
        tzinfo=None
    )

    transaction.status = "Paid"

    transaction.payment_reference = (
        f"DEMO-PAY-{transaction.id:08d}"
    )

    transaction.receipt_number = (
        f"HHR-{now:%Y%m%d}-"
        f"{transaction.id:06d}"
    )

    transaction.completed_at = now

    fee.status = "Paid"
    fee.payment_date = now.date()
    fee.payment_method = "Online Demo"

    db.commit()
    db.refresh(transaction)

    return transaction


@router.post(
    "/payments/{transaction_id}/fail-demo",
    response_model=PaymentTransactionResponse,
)
def fail_demo_payment(
    transaction_id: int,
    payload: PaymentFailureRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Student")
    ),
):
    student = get_student_for_user(
        db,
        current_user,
    )

    transaction = (
        db.query(PaymentTransaction)
        .filter(
            PaymentTransaction.id
            == transaction_id,

            PaymentTransaction.student_id
            == student.id,
        )
        .first()
    )

    if transaction is None:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found.",
        )

    if transaction.status == "Paid":
        raise HTTPException(
            status_code=409,
            detail=(
                "A paid transaction cannot fail."
            ),
        )

    transaction.status = "Failed"

    transaction.failure_reason = (
        payload.reason.strip()
    )

    transaction.completed_at = (
        datetime.now(
            timezone.utc
        ).replace(
            tzinfo=None
        )
    )

    db.commit()
    db.refresh(transaction)

    return transaction


@router.post(
    "/",
    response_model=FeeResponse,
)
def create_fee(
    fee: FeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin")
    ),
):
    student = (
        db.query(Student)
        .filter(
            Student.id
            == fee.student_id
        )
        .first()
    )

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found.",
        )

    record = Fee(
        student_id=fee.student_id,
        amount=fee.amount,
        due_date=fee.due_date,
        payment_date=fee.payment_date,
        status=fee.status,
        payment_method=fee.payment_method,
        description=fee.description,
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return record


@router.get(
    "/",
    response_model=list[
        FeeResponse
    ],
)
def all_fees(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "Admin",
            "Warden",
        )
    ),
):
    return (
        db.query(Fee)
        .order_by(
            Fee.due_date.desc()
        )
        .all()
    )


@router.get(
    "/{fee_id}",
    response_model=FeeResponse,
)
def get_fee(
    fee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "Admin",
            "Warden",
        )
    ),
):
    fee = (
        db.query(Fee)
        .filter(
            Fee.id == fee_id
        )
        .first()
    )

    if fee is None:
        raise HTTPException(
            status_code=404,
            detail="Fee not found.",
        )

    return fee


@router.put(
    "/{fee_id}",
    response_model=FeeResponse,
)
def update_fee(
    fee_id: int,
    payload: FeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin")
    ),
):
    fee = (
        db.query(Fee)
        .filter(
            Fee.id == fee_id
        )
        .first()
    )

    if fee is None:
        raise HTTPException(
            status_code=404,
            detail="Fee not found.",
        )

    student = (
        db.query(Student)
        .filter(
            Student.id
            == payload.student_id
        )
        .first()
    )

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student not found.",
        )

    fee.student_id = (
        payload.student_id
    )

    fee.amount = payload.amount

    fee.due_date = (
        payload.due_date
    )

    fee.payment_date = (
        payload.payment_date
    )

    fee.status = payload.status

    fee.payment_method = (
        payload.payment_method
    )

    fee.description = (
        payload.description
    )

    db.commit()
    db.refresh(fee)

    return fee


@router.delete(
    "/{fee_id}"
)
def delete_fee(
    fee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin")
    ),
):
    fee = (
        db.query(Fee)
        .filter(
            Fee.id == fee_id
        )
        .first()
    )

    if fee is None:
        raise HTTPException(
            status_code=404,
            detail="Fee not found.",
        )

    transaction_exists = (
        db.query(PaymentTransaction)
        .filter(
            PaymentTransaction.fee_id
            == fee.id
        )
        .first()
    )

    if transaction_exists:
        raise HTTPException(
            status_code=409,
            detail=(
                "This fee has payment history "
                "and cannot be deleted."
            ),
        )

    db.delete(fee)
    db.commit()

    return {
        "message":
            "Fee deleted successfully"
    }