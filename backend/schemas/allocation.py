from datetime import date

from pydantic import BaseModel


class AllocationCreate(BaseModel):
    student_id: int
    room_id: int
    allocation_date: date | None = None
    status: str = "Active"


class AllocationResponse(BaseModel):
    id: int
    student_id: int
    room_id: int
    allocation_date: date
    status: str

    model_config = {
        "from_attributes": True
    }