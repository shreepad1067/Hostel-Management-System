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


class AttendanceBlockResponse(BaseModel):
    block: str
    floors: list[int]


class AttendanceRosterItem(BaseModel):
    student_id: int

    student_code: str | None = None

    student_name: str

    room_number: str | None = None

    block: str
    floor: int

    attendance_id: int | None = None

    status: str | None = None

    remarks: str | None = None


class AttendanceBulkEntry(BaseModel):
    student_id: int
    status: str
    remarks: str | None = None


class AttendanceBulkRequest(BaseModel):
    block: str
    floor: int | None = None

    attendance_date: date

    entries: list[
        AttendanceBulkEntry
    ]