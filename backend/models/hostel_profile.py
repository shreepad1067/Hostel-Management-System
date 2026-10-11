from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from database import Base


class HostelProfile(Base):
    __tablename__ = "hostel_profile"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        default=1,
        autoincrement=False,
    )

    hostel_name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        default="HostelHub Residence",
    )

    description: Mapped[
        str | None
    ] = mapped_column(
        Text,
        nullable=True,
    )

    hero_image_url: Mapped[
        str | None
    ] = mapped_column(
        String(500),
        nullable=True,
    )

    address: Mapped[
        str | None
    ] = mapped_column(
        String(500),
        nullable=True,
    )

    phone: Mapped[
        str | None
    ] = mapped_column(
        String(30),
        nullable=True,
    )

    email: Mapped[
        str | None
    ] = mapped_column(
        String(150),
        nullable=True,
    )

    facilities: Mapped[
        str | None
    ] = mapped_column(
        Text,
        nullable=True,
    )

    rules: Mapped[
        str | None
    ] = mapped_column(
        Text,
        nullable=True,
    )

    emergency_contacts: Mapped[
        str | None
    ] = mapped_column(
        Text,
        nullable=True,
    )

    office_hours: Mapped[
        str | None
    ] = mapped_column(
        String(250),
        nullable=True,
    )

    capacity: Mapped[
        int | None
    ] = mapped_column(
        Integer,
        nullable=True,
    )

    blocks: Mapped[
        int | None
    ] = mapped_column(
        Integer,
        nullable=True,
    )

    mess_info: Mapped[
        str | None
    ] = mapped_column(
        Text,
        nullable=True,
    )

    updated_by: Mapped[
        int | None
    ] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
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