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


class MaintenanceWorkOrder(Base):
    __tablename__ = (
        "maintenance_work_orders"
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    student_id: Mapped[
        int | None
    ] = mapped_column(
        Integer,
        ForeignKey(
            "students.id"
        ),
        nullable=True,
        index=True,
    )

    room_id: Mapped[
        int | None
    ] = mapped_column(
        Integer,
        ForeignKey(
            "rooms.id"
        ),
        nullable=True,
        index=True,
    )

    created_by_user_id: Mapped[int] = (
        mapped_column(
            Integer,
            ForeignKey(
                "users.id"
            ),
            nullable=False,
        )
    )

    title: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    description: Mapped[str] = (
        mapped_column(
            String(1500),
            nullable=False,
        )
    )

    category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    priority: Mapped[str] = mapped_column(
        String(20),
        default="Medium",
        nullable=False,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="Open",
        nullable=False,
        index=True,
    )

    assigned_to: Mapped[
        str | None
    ] = mapped_column(
        String(150),
        nullable=True,
    )

    assigned_contact: Mapped[
        str | None
    ] = mapped_column(
        String(50),
        nullable=True,
    )

    scheduled_date: Mapped[
        date | None
    ] = mapped_column(
        Date,
        nullable=True,
    )

    resolution: Mapped[
        str | None
    ] = mapped_column(
        String(1500),
        nullable=True,
    )

    completed_at: Mapped[
        datetime | None
    ] = mapped_column(
        DateTime,
        nullable=True,
    )

    created_at: Mapped[datetime] = (
        mapped_column(
            DateTime,
            default=utc_now,
            nullable=False,
        )
    )

    updated_at: Mapped[datetime] = (
        mapped_column(
            DateTime,
            default=utc_now,
            onupdate=utc_now,
            nullable=False,
        )
    )