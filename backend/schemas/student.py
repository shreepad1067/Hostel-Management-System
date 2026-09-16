from pydantic import BaseModel, ConfigDict
from typing import Optional


class StudentCreate(BaseModel):
    name: str
    email: str
    phone: str
    course: str
    year: int
    room_number: Optional[str] = None
    user_id: Optional[int] = None


class StudentUpdate(BaseModel):
    name: str
    email: str
    phone: str
    course: str
    year: int
    room_number: Optional[str] = None
    user_id: Optional[int] = None


class StudentResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    course: str
    year: int
    room_number: Optional[str] = None
    user_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)