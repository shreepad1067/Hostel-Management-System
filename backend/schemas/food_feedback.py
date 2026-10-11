from datetime import (
    date,
    datetime,
)

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


class FoodFeedbackCreate(BaseModel):
    meal_date: date
    meal_type: str

    taste_rating: int = Field(
        ge=1,
        le=5,
    )

    quality_rating: int = Field(
        ge=1,
        le=5,
    )

    quantity_rating: int = Field(
        ge=1,
        le=5,
    )

    hygiene_rating: int = Field(
        ge=1,
        le=5,
    )

    comment: str | None = Field(
        default=None,
        max_length=1000,
    )


class FoodFeedbackResponse(BaseModel):
    id: int
    student_id: int

    meal_date: date
    meal_type: str

    taste_rating: int
    quality_rating: int
    quantity_rating: int
    hygiene_rating: int

    comment: str | None
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class FoodFeedbackSummary(BaseModel):
    meal_type: str
    responses: int

    taste: float
    quality: float
    quantity: float
    hygiene: float

    overall: float