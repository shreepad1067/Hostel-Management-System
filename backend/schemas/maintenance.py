from datetime import (
    date,
    datetime,
)

from typing import Literal

from pydantic import (
    BaseModel,
    Field,
)


MaintenanceCategory = Literal[
    "Electrical",
    "Plumbing",
    "Furniture",
    "Cleaning",
    "Wi-Fi",
    "Appliance",
    "Bathroom",
    "Door / Lock",
    "Other",
]


MaintenancePriority = Literal[
    "Low",
    "Medium",
    "High",
    "Urgent",
]


MaintenanceStatus = Literal[
    "Open",
    "Assigned",
    "In Progress",
    "On Hold",
    "Resolved",
    "Closed",
    "Cancelled",
]


class MaintenanceCreate(
    BaseModel
):
    title: str = Field(
        min_length=3,
        max_length=150,
    )

    description: str = Field(
        min_length=5,
        max_length=1500,
    )

    category: MaintenanceCategory

    priority: MaintenancePriority = (
        "Medium"
    )

    student_id: int | None = None

    room_id: int | None = None


class MaintenanceUpdate(
    BaseModel
):
    priority: (
        MaintenancePriority
        | None
    ) = None

    status: (
        MaintenanceStatus
        | None
    ) = None

    assigned_to: str | None = Field(
        default=None,
        max_length=150,
    )

    assigned_contact: (
        str | None
    ) = Field(
        default=None,
        max_length=50,
    )

    scheduled_date: date | None = None

    resolution: str | None = Field(
        default=None,
        max_length=1500,
    )


class MaintenanceResponse(
    BaseModel
):
    id: int

    work_order_number: str

    student_id: int | None
    student_name: str | None
    student_code: str | None

    room_id: int | None
    room_number: str | None
    block: str | None
    floor: int | None

    created_by_user_id: int
    created_by_name: str

    title: str
    description: str

    category: str
    priority: str
    status: str

    assigned_to: str | None
    assigned_contact: str | None

    scheduled_date: date | None

    resolution: str | None

    completed_at: datetime | None

    created_at: datetime
    updated_at: datetime