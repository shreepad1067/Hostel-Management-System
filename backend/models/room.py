from sqlalchemy import String, Integer
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

    status: Mapped[str] = mapped_column(
        String(20),
        default="Available",
        nullable=False
    )