from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict


class StudentCreate(BaseModel):
    student_code: Optional[str] = None
    name: str
    email: str
    phone: str
    course: str
    year: int
    room_number: Optional[str] = None
    guardian_phone: Optional[str] = None
    parent_name: Optional[str] = None
    parent_email: Optional[str] = None
    emergency_contact: Optional[str] = None
    address: Optional[str] = None
    room_preference: Optional[str] = None
    admission_status: str = "Pending"
    admission_date: Optional[date] = None
    user_id: Optional[int] = None


class StudentUpdate(BaseModel):
    student_code: Optional[str] = None
    name: str
    email: str
    phone: str
    course: str
    year: int
    room_number: Optional[str] = None
    guardian_phone: Optional[str] = None
    parent_name: Optional[str] = None
    parent_email: Optional[str] = None
    emergency_contact: Optional[str] = None
    address: Optional[str] = None
    room_preference: Optional[str] = None
    admission_status: str = "Pending"
    admission_date: Optional[date] = None
    user_id: Optional[int] = None


class StudentResponse(BaseModel):
    id: int
    student_code: Optional[str] = None
    name: str
    email: str
    phone: str
    course: str
    year: int
    room_number: Optional[str] = None
    guardian_phone: Optional[str] = None
    parent_name: Optional[str] = None
    parent_email: Optional[str] = None
    emergency_contact: Optional[str] = None
    address: Optional[str] = None
    room_preference: Optional[str] = None
    admission_status: str
    admission_date: Optional[date] = None
    user_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)