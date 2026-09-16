from datetime import date

from sqlalchemy import Date, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class RoomAllocation(Base):
    __tablename__ = "room_allocations"

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

    room_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("rooms.id"),
        nullable=False
    )

    allocation_date: Mapped[date] = mapped_column(
        Date,
        default=date.today,
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="Active",
        nullable=False
    )