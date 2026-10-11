from datetime import date
from typing import Optional

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


class StudentCreate(BaseModel):
    student_code: Optional[str] = None

    name: str
    email: str
    phone: str
    course: str

    department: Optional[str] = None

    year: int

    semester: Optional[int] = Field(
        default=None,
        ge=1,
        le=12,
    )

    profile_photo_url: Optional[str] = None

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

    department: Optional[str] = None

    year: int

    semester: Optional[int] = Field(
        default=None,
        ge=1,
        le=12,
    )

    profile_photo_url: Optional[str] = None

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


class StudentSelfUpdate(BaseModel):
    phone: str

    profile_photo_url: Optional[str] = None

    guardian_phone: Optional[str] = None
    parent_name: Optional[str] = None
    parent_email: Optional[str] = None
    emergency_contact: Optional[str] = None

    address: Optional[str] = None


class StudentResponse(BaseModel):
    id: int

    student_code: Optional[str] = None

    name: str
    email: str
    phone: str
    course: str

    department: Optional[str] = None

    year: int
    semester: Optional[int] = None

    profile_photo_url: Optional[str] = None

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

    model_config = ConfigDict(
        from_attributes=True
    )