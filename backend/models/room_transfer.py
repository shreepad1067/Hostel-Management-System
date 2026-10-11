from datetime import (
    datetime,
    timezone,
)

from sqlalchemy import (
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


class RoomTransferRequest(Base):
    __tablename__ = (
        "room_transfer_requests"
    )

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

    current_room_id: Mapped[int] = (
        mapped_column(
            Integer,
            ForeignKey(
                "rooms.id"
            ),
            nullable=False,
        )
    )

    preferred_sharing: Mapped[int] = (
        mapped_column(
            Integer,
            nullable=False,
        )
    )

    reason: Mapped[str] = mapped_column(
        String(1000),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="Pending",
        nullable=False,
        index=True,
    )

    requested_at: Mapped[datetime] = (
        mapped_column(
            DateTime,
            default=utc_now,
            nullable=False,
        )
    )

    reviewed_at: Mapped[
        datetime | None
    ] = mapped_column(
        DateTime,
        nullable=True,
    )

    reviewed_by_user_id: Mapped[
        int | None
    ] = mapped_column(
        Integer,
        ForeignKey(
            "users.id"
        ),
        nullable=True,
    )

    new_room_id: Mapped[
        int | None
    ] = mapped_column(
        Integer,
        ForeignKey(
            "rooms.id"
        ),
        nullable=True,
    )

    admin_note: Mapped[
        str | None
    ] = mapped_column(
        String(1000),
        nullable=True,
    )