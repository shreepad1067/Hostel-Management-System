from datetime import datetime

from pydantic import BaseModel


class SOSAlertCreate(BaseModel):
    category: str
    description: str
    location: str | None = None


class SOSAlertVerify(BaseModel):
    decision: str
    verification_note: str | None = None


class SOSAlertResponse(BaseModel):
    id: int

    student_id: int
    student_code: str | None = None
    student_name: str

    category: str
    description: str
    location: str | None = None

    status: str
    created_at: datetime

    verified_by: int | None = None
    verified_at: datetime | None = None
    verification_note: str | None = None

    parent_notified: bool
    parent_notified_at: datetime | None = None


class SOSAlertLogResponse(BaseModel):
    id: int
    alert_id: int
    action: str
    performed_by: int | None = None
    note: str | None = None
    created_at: datetime