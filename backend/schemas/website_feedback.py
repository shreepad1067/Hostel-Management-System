from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


class WebsiteFeedbackCreate(BaseModel):
    category: str = Field(
        min_length=2,
        max_length=30,
    )

    rating: int = Field(
        ge=1,
        le=5,
    )

    message: str = Field(
        min_length=5,
        max_length=1500,
    )


class WebsiteFeedbackUpdate(BaseModel):
    status: str

    admin_note: str | None = Field(
        default=None,
        max_length=1000,
    )


class WebsiteFeedbackResponse(BaseModel):
    id: int
    student_id: int

    category: str
    rating: int
    message: str

    status: str

    admin_note: str | None

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )