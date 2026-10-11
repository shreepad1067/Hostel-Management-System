from datetime import (
    date,
    datetime,
)

from typing import Literal

from pydantic import (
    BaseModel,
    Field,
)


VisitorStatus = Literal[
    "Pending",
    "Approved",
    "Rejected",
    "Expected",
    "Checked In",
    "Completed",
    "Cancelled",
]


class VisitorCreate(
    BaseModel
):
    student_id: int | None = None

    visitor_name: str = Field(
        min_length=2,
        max_length=100,
    )

    relation: str = Field(
        min_length=2,
        max_length=50,
    )

    phone: str = Field(
        min_length=5,
        max_length=15,
    )

    purpose: str = Field(
        min_length=3,
        max_length=255,
    )

    visit_date: date | None = None

    check_in: datetime | None = None

    check_out: datetime | None = None

    status: VisitorStatus = "Pending"

    remarks: str | None = Field(
        default=None,
        max_length=500,
    )


class VisitorUpdate(
    BaseModel
):
    student_id: int | None = None

    visitor_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    relation: str | None = Field(
        default=None,
        min_length=2,
        max_length=50,
    )

    phone: str | None = Field(
        default=None,
        min_length=5,
        max_length=15,
    )

    purpose: str | None = Field(
        default=None,
        min_length=3,
        max_length=255,
    )

    visit_date: date | None = None

    check_in: datetime | None = None

    check_out: datetime | None = None

    status: VisitorStatus | None = None

    remarks: str | None = Field(
        default=None,
        max_length=500,
    )


class VisitorReview(
    BaseModel
):
    decision: Literal[
        "Approved",
        "Rejected",
    ]

    remarks: str | None = Field(
        default=None,
        max_length=500,
    )


class VisitorScanRequest(
    BaseModel
):
    qr_code: str = Field(
        min_length=10,
        max_length=100,
    )


class VisitorResponse(
    BaseModel
):
    id: int

    student_id: int

    student_name: str | None
    student_code: str | None

    visitor_name: str
    relation: str
    phone: str
    purpose: str

    visit_date: date

    check_in: datetime | None
    check_out: datetime | None

    status: str

    remarks: str | None

    qr_code: str | None

    approved_at: datetime | None

    approved_by_user_id: int | None
    approved_by_name: str | None

    created_at: datetime

    pass_available: bool


class VisitorScanResponse(
    BaseModel
):
    action: Literal[
        "Check In",
        "Check Out",
    ]

    message: str

    visitor: VisitorResponse