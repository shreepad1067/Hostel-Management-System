from decimal import Decimal

from sqlalchemy import String, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class Room(Base):
    __tablename__ = "rooms"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    room_number: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False
    )

    block: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True
    )

    capacity: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    occupied: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )

    floor: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    bathroom_type: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True
    )

    room_type: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True
    )

    monthly_fee: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2),
        nullable=True
    )

    specifications: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="Available",
        nullable=False
    )