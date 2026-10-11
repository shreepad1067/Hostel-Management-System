from datetime import (
    date,
    datetime,
    timezone,
)

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from database import Base


def utc_now():
    return (
        datetime.now(timezone.utc)
        .replace(tzinfo=None)
    )


class Visitor(Base):
    __tablename__ = "visitors"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    student_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "students.id"
        ),
        nullable=False,
        index=True,
    )

    visitor_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    relation: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    phone: Mapped[str] = mapped_column(
        String(15),
        nullable=False,
    )

    purpose: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    visit_date: Mapped[date] = mapped_column(
        Date,
        default=date.today,
        nullable=False,
        index=True,
    )

    check_in: Mapped[
        datetime | None
    ] = mapped_column(
        DateTime,
        nullable=True,
    )

    check_out: Mapped[
        datetime | None
    ] = mapped_column(
        DateTime,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="Pending",
        nullable=False,
        index=True,
    )

    remarks: Mapped[
        str | None
    ] = mapped_column(
        String(500),
        nullable=True,
    )


    # ==========================================
    # FEATURE 6 — QR VISITOR PASS
    # ==========================================

    qr_code: Mapped[
        str | None
    ] = mapped_column(
        String(100),
        unique=True,
        nullable=True,
        index=True,
    )

    approved_at: Mapped[
        datetime | None
    ] = mapped_column(
        DateTime,
        nullable=True,
    )

    approved_by_user_id: Mapped[
        int | None
    ] = mapped_column(
        Integer,
        ForeignKey(
            "users.id"
        ),
        nullable=True,
    )

    created_at: Mapped[
        datetime
    ] = mapped_column(
        DateTime,
        default=utc_now,
        nullable=False,
    )