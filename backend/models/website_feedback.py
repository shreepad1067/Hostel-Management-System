from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    SmallInteger,
    String,
    func,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from database import Base


class WebsiteFeedback(Base):
    __tablename__ = "website_feedback"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    student_id: Mapped[int] = mapped_column(
        ForeignKey(
            "students.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    category: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    rating: Mapped[int] = mapped_column(
        SmallInteger,
        nullable=False,
    )

    message: Mapped[str] = mapped_column(
        String(1500),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="New",
    )

    admin_note: Mapped[
        str | None
    ] = mapped_column(
        String(1000),
        nullable=True,
    )

    created_at: Mapped[
        datetime
    ] = mapped_column(
        DateTime,
        nullable=False,
        server_default=(
            func.current_timestamp()
        ),
    )

    updated_at: Mapped[
        datetime
    ] = mapped_column(
        DateTime,
        nullable=False,
        server_default=(
            func.current_timestamp()
        ),
        server_onupdate=(
            func.current_timestamp()
        ),
    )