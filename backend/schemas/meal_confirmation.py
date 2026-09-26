from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class MealConfirmationCreate(BaseModel):
    meal_type: str


class MealConfirmationResponse(BaseModel):
    id: int
    student_id: int
    meal_date: date
    meal_type: str
    status: str
    confirmed_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class MealRecordResponse(BaseModel):
    id: int
    student_id: int
    student_code: str | None = None
    student_name: str

    meal_date: date
    meal_type: str
    status: str
    confirmed_at: datetime