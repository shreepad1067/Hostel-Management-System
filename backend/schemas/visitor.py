from datetime import date, datetime

from pydantic import BaseModel


class VisitorCreate(BaseModel):
    student_id: int | None = None
    visitor_name: str
    relation: str
    phone: str
    purpose: str
    visit_date: date | None = None
    check_in: datetime | None = None
    check_out: datetime | None = None
    status: str = "Expected"
    remarks: str | None = None


class VisitorUpdate(BaseModel):
    student_id: int
    visitor_name: str
    relation: str
    phone: str
    purpose: str
    visit_date: date
    check_in: datetime | None = None
    check_out: datetime | None = None
    status: str
    remarks: str | None = None


class VisitorResponse(BaseModel):
    id: int
    student_id: int
    visitor_name: str
    relation: str
    phone: str
    purpose: str
    visit_date: date
    check_in: datetime | None
    check_out: datetime | None
    status: str
    remarks: str | None

    model_config = {
        "from_attributes": True
    }