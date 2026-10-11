from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
)


class NotificationResponse(BaseModel):
    id: int
    user_id: int

    title: str
    message: str

    category: str
    level: str

    link: str | None

    is_read: bool

    created_at: datetime
    read_at: datetime | None

    model_config = ConfigDict(
        from_attributes=True
    )


class NotificationCountResponse(BaseModel):
    unread_count: int
