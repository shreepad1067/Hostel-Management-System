from datetime import (
    datetime,
    timezone,
)

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from database import Base


def utc_now():
    return (
        datetime.now(
            timezone.utc
        )
        .replace(
            tzinfo=None
        )
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    actor_user_id: Mapped[
        int | None
    ] = mapped_column(
        Integer,
        ForeignKey(
            "users.id"
        ),
        nullable=True,
        index=True,
    )

    actor_name: Mapped[
        str | None
    ] = mapped_column(
        String(150),
        nullable=True,
    )

    actor_role: Mapped[
        str | None
    ] = mapped_column(
        String(50),
        nullable=True,
        index=True,
    )

    action: Mapped[str] = mapped_column(
        String(60),
        nullable=False,
        index=True,
    )

    module: Mapped[str] = mapped_column(
        String(80),
        nullable=False,
        index=True,
    )

    entity_type: Mapped[
        str | None
    ] = mapped_column(
        String(80),
        nullable=True,
    )

    entity_id: Mapped[
        int | None
    ] = mapped_column(
        Integer,
        nullable=True,
        index=True,
    )

    description: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    request_method: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
    )

    request_path: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    response_status: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    outcome: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True,
    )

    details: Mapped[
        str | None
    ] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=utc_now,
        nullable=False,
        index=True,
    )