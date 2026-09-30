from datetime import (
    date,
    datetime,
)

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


class FeeCreate(BaseModel):
    student_id: int
    amount: float
    due_date: date

    payment_date: date | None = None

    status: str = "Pending"

    payment_method: str | None = None

    description: str | None = None


class FeeUpdate(BaseModel):
    student_id: int
    amount: float
    due_date: date

    payment_date: date | None = None

    status: str

    payment_method: str | None = None

    description: str | None = None


class FeeResponse(BaseModel):
    id: int
    student_id: int
    amount: float

    due_date: date

    payment_date: date | None

    status: str

    payment_method: str | None

    description: str | None

    model_config = ConfigDict(
        from_attributes=True
    )


class PaymentSettingsUpdate(BaseModel):
    payment_enabled: bool = True

    account_holder_name: str | None = Field(
        default=None,
        max_length=150,
    )

    bank_name: str | None = Field(
        default=None,
        max_length=150,
    )

    account_last4: str | None = Field(
        default=None,
        max_length=4,
    )

    ifsc_code: str | None = Field(
        default=None,
        max_length=30,
    )

    upi_id: str | None = Field(
        default=None,
        max_length=100,
    )

    support_email: str | None = Field(
        default=None,
        max_length=150,
    )

    failure_message: str | None = Field(
        default=None,
        max_length=500,
    )


class PaymentSettingsResponse(
    PaymentSettingsUpdate
):
    id: int
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class PaymentTransactionResponse(BaseModel):
    id: int
    fee_id: int
    student_id: int

    amount: float
    status: str
    payment_method: str

    payment_reference: str | None
    receipt_number: str | None
    failure_reason: str | None

    created_at: datetime
    completed_at: datetime | None

    model_config = ConfigDict(
        from_attributes=True
    )


class PaymentStartResponse(BaseModel):
    transaction_id: int
    fee_id: int
    amount: float

    mode: str
    status: str


class PaymentFailureRequest(BaseModel):
    reason: str = Field(
        min_length=2,
        max_length=500,
    )