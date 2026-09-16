from datetime import date

from pydantic import BaseModel


class ComplaintCreate(BaseModel):
    student_id: int
    title: str
    description: str
    category: str
    complaint_date: date | None = None
    status: str = "Pending"
    resolution: str | None = None


class ComplaintUpdate(BaseModel):
    student_id: int
    title: str
    description: str
    category: str
    complaint_date: date
    status: str
    resolution: str | None = None


class ComplaintResponse(BaseModel):
    id: int
    student_id: int
    title: str
    description: str
    category: str
    complaint_date: date
    status: str
    resolution: str | None

    model_config = {
        "from_attributes": True
    }