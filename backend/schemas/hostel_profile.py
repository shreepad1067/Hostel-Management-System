from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


class HostelProfileUpdate(BaseModel):
    hostel_name: str = Field(
        min_length=2,
        max_length=200,
    )

    description: str | None = None

    hero_image_url: str | None = None

    address: str | None = None

    phone: str | None = None

    email: str | None = None

    facilities: str | None = None

    rules: str | None = None

    emergency_contacts: str | None = None

    office_hours: str | None = None

    capacity: int | None = Field(
        default=None,
        ge=0,
    )

    blocks: int | None = Field(
        default=None,
        ge=0,
    )

    mess_info: str | None = None


class HostelProfileResponse(
    HostelProfileUpdate
):
    id: int
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )