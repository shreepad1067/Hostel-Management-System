from datetime import date
from typing import Literal

from pydantic import BaseModel


class AllocationCreate(BaseModel):
    student_id: int
    room_id: int
    allocation_date: date | None = None
    status: Literal["Active"] = "Active"


class AllocationResponse(BaseModel):
    id: int
    student_id: int
    room_id: int
    allocation_date: date
    status: str

    model_config = {
        "from_attributes": True
    }