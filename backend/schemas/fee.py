from datetime import date

from pydantic import BaseModel


class FeeCreate(BaseModel):
    student_id: int
    amount: float
    due_date: date
    payment_date: date | None = None
    status: str = "Pending"
    payment_method: str | None = None
    description: str | None = None


class FeeUpdate(BaseModel):
    student_id: int
    amount: float
    due_date: date
    payment_date: date | None = None
    status: str
    payment_method: str | None = None
    description: str | None = None


class FeeResponse(BaseModel):
    id: int
    student_id: int
    amount: float
    due_date: date
    payment_date: date | None
    status: str
    payment_method: str | None
    description: str | None

    model_config = {
        "from_attributes": True
    }