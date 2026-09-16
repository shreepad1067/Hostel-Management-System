from datetime import date

from sqlalchemy import Date, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class Leave(Base):
    __tablename__ = "leaves"

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

    leave_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    reason: Mapped[str] = mapped_column(
        String(500),
        nullable=False
    )

    start_date: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )

    end_date: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="Pending",
        nullable=False
    )

    applied_date: Mapped[date] = mapped_column(
        Date,
        default=date.today,
        nullable=False
    )

    remarks: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )