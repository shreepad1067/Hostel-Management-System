from datetime import (
    date,
    datetime,
)

from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    String,
    func,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from database import Base


class Fee(Base):
    __tablename__ = "fees"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    student_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("students.id"),
        nullable=False
    )

    amount: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    due_date: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )

    payment_date: Mapped[
        date | None
    ] = mapped_column(
        Date,
        nullable=True
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="Pending",
        nullable=False
    )

    payment_method: Mapped[
        str | None
    ] = mapped_column(
        String(50),
        nullable=True
    )

    description: Mapped[
        str | None
    ] = mapped_column(
        String(255),
        nullable=True
    )


class PaymentSettings(Base):
    __tablename__ = "payment_settings"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        default=1,
        autoincrement=False,
    )

    payment_enabled: Mapped[
        bool
    ] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    account_holder_name: Mapped[
        str | None
    ] = mapped_column(
        String(150),
        nullable=True,
    )

    bank_name: Mapped[
        str | None
    ] = mapped_column(
        String(150),
        nullable=True,
    )

    account_last4: Mapped[
        str | None
    ] = mapped_column(
        String(4),
        nullable=True,
    )

    ifsc_code: Mapped[
        str | None
    ] = mapped_column(
        String(30),
        nullable=True,
    )

    upi_id: Mapped[
        str | None
    ] = mapped_column(
        String(100),
        nullable=True,
    )

    support_email: Mapped[
        str | None
    ] = mapped_column(
        String(150),
        nullable=True,
    )

    failure_message: Mapped[
        str | None
    ] = mapped_column(
        String(500),
        nullable=True,
    )

    updated_by: Mapped[
        int | None
    ] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )

    updated_at: Mapped[
        datetime
    ] = mapped_column(
        DateTime,
        nullable=False,
        server_default=(
            func.current_timestamp()
        ),
        server_onupdate=(
            func.current_timestamp()
        ),
    )


class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    fee_id: Mapped[int] = mapped_column(
        ForeignKey("fees.id"),
        nullable=False,
        index=True,
    )

    student_id: Mapped[int] = mapped_column(
        ForeignKey("students.id"),
        nullable=False,
        index=True,
    )

    amount: Mapped[
        Decimal
    ] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="Initiated",
    )

    payment_method: Mapped[
        str
    ] = mapped_column(
        String(50),
        nullable=False,
        default="Online Demo",
    )

    payment_reference: Mapped[
        str | None
    ] = mapped_column(
        String(100),
        nullable=True,
        unique=True,
    )

    receipt_number: Mapped[
        str | None
    ] = mapped_column(
        String(100),
        nullable=True,
        unique=True,
    )

    failure_reason: Mapped[
        str | None
    ] = mapped_column(
        String(500),
        nullable=True,
    )

    created_at: Mapped[
        datetime
    ] = mapped_column(
        DateTime,
        nullable=False,
        server_default=(
            func.current_timestamp()
        ),
    )

    completed_at: Mapped[
        datetime | None
    ] = mapped_column(
        DateTime,
        nullable=True,
    )