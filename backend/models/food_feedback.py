from datetime import (
    date,
    datetime,
)

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Integer,
    SmallInteger,
    String,
    UniqueConstraint,
    func,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from database import Base


class FoodFeedback(Base):
    __tablename__ = "food_feedback"

    __table_args__ = (
        UniqueConstraint(
            "student_id",
            "meal_date",
            "meal_type",
            name=(
                "unique_student_food_feedback"
            ),
        ),
    )

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

    meal_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    meal_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    taste_rating: Mapped[int] = mapped_column(
        SmallInteger,
        nullable=False,
    )

    quality_rating: Mapped[int] = mapped_column(
        SmallInteger,
        nullable=False,
    )

    quantity_rating: Mapped[int] = mapped_column(
        SmallInteger,
        nullable=False,
    )

    hygiene_rating: Mapped[int] = mapped_column(
        SmallInteger,
        nullable=False,
    )

    comment: Mapped[
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