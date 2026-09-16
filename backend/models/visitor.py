from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class Visitor(Base):
    __tablename__ = "visitors"

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

    visitor_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    relation: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    phone: Mapped[str] = mapped_column(
        String(15),
        nullable=False
    )

    purpose: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    visit_date: Mapped[date] = mapped_column(
        Date,
        default=date.today,
        nullable=False
    )

    check_in: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    check_out: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="Expected",
        nullable=False
    )

    remarks: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )