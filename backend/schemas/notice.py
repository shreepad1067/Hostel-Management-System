from datetime import date

from pydantic import BaseModel


class NoticeCreate(BaseModel):
    title: str
    content: str
    category: str
    notice_date: date | None = None
    expiry_date: date | None = None
    status: str = "Active"
    remarks: str | None = None


class NoticeUpdate(BaseModel):
    title: str
    content: str
    category: str
    notice_date: date
    expiry_date: date | None = None
    status: str
    remarks: str | None = None


class NoticeResponse(BaseModel):
    id: int
    title: str
    content: str
    category: str
    notice_date: date
    expiry_date: date | None
    status: str
    remarks: str | None

    model_config = {
        "from_attributes": True
    }