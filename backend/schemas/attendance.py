from datetime import date

from pydantic import BaseModel


class AttendanceCreate(BaseModel):
    student_id: int
    attendance_date: date
    status: str
    remarks: str | None = None


class AttendanceUpdate(BaseModel):
    student_id: int
    attendance_date: date
    status: str
    remarks: str | None = None


class AttendanceResponse(BaseModel):
    id: int
    student_id: int
    attendance_date: date
    status: str
    remarks: str | None

    model_config = {
        "from_attributes": True
    }