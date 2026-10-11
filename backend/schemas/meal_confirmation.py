from datetime import date, datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


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


class MealQRGenerateRequest(BaseModel):
    meal_type: str

    duration_seconds: int = Field(
        default=90,
        ge=30,
        le=300,
    )


class MealQRScanRequest(BaseModel):
    qr_token: str = Field(
        min_length=20
    )


class MealQRResponse(BaseModel):
    session_id: int
    meal_type: str
    meal_date: date
    expires_at: datetime
    qr_token: str