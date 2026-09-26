from datetime import date

from sqlalchemy import String, Integer, ForeignKey, Date
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    student_code: Mapped[str | None] = mapped_column(
        String(30),
        unique=True,
        nullable=True
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    email: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False
    )

    phone: Mapped[str] = mapped_column(
        String(15),
        nullable=False
    )

    course: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    year: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    room_number: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True
    )

    guardian_phone: Mapped[str | None] = mapped_column(
        String(15),
        nullable=True
    )

    parent_name: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )

    parent_email: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )

    emergency_contact: Mapped[str | None] = mapped_column(
        String(15),
        nullable=True
    )

    address: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    room_preference: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True
    )

    admission_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="Pending"
    )

    admission_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True
    )

    user_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id"),
        unique=True,
        nullable=True
    )