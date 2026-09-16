from datetime import date

from pydantic import BaseModel


class LeaveCreate(BaseModel):
    student_id: int
    leave_type: str
    reason: str
    start_date: date
    end_date: date
    status: str = "Pending"
    applied_date: date | None = None
    remarks: str | None = None


class LeaveUpdate(BaseModel):
    student_id: int
    leave_type: str
    reason: str
    start_date: date
    end_date: date
    status: str
    applied_date: date
    remarks: str | None = None


class LeaveResponse(BaseModel):
    id: int
    student_id: int
    leave_type: str
    reason: str
    start_date: date
    end_date: date
    status: str
    applied_date: date
    remarks: str | None

    model_config = {
        "from_attributes": True
    }