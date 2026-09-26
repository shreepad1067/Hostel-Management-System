from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    String,
    UniqueConstraint,
    func,
)

from sqlalchemy.dialects.mysql import INTEGER

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from database import Base


class FoodMenu(Base):
    __tablename__ = "food_menu"

    __table_args__ = (
        UniqueConstraint(
            "day_of_week",
            "meal_type",
            name="unique_food_menu",
        ),
    )

    id: Mapped[int] = mapped_column(
        INTEGER(unsigned=True),
        primary_key=True,
        index=True,
        autoincrement=True,
    )

    day_of_week: Mapped[str] = mapped_column(
        String(15),
        nullable=False,
    )

    meal_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    menu_items: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    serving_time: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp(),
        server_onupdate=func.current_timestamp(),
    )