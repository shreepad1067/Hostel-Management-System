from datetime import date

from sqlalchemy import Date, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class Notice(Base):
    __tablename__ = "notices"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    title: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    content: Mapped[str] = mapped_column(
        String(1000),
        nullable=False
    )

    category: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    notice_date: Mapped[date] = mapped_column(
        Date,
        default=date.today,
        nullable=False
    )

    expiry_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="Active",
        nullable=False
    )

    remarks: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )