from datetime import datetime
from typing import Literal

from pydantic import (
    BaseModel,
    Field,
)


class RoomTransferCreate(
    BaseModel
):
    preferred_sharing: Literal[
        1,
        2,
        3,
        4,
    ]

    reason: str = Field(
        min_length=5,
        max_length=1000,
    )


class RoomTransferReview(
    BaseModel
):
    decision: Literal[
        "Approved",
        "Rejected",
    ]

    new_room_id: int | None = None

    admin_note: str | None = Field(
        default=None,
        max_length=1000,
    )


class RoomTransferResponse(
    BaseModel
):
    id: int

    student_id: int
    student_name: str
    student_code: str | None

    current_room_id: int
    current_room_number: str

    preferred_sharing: int

    reason: str

    status: str

    requested_at: datetime

    reviewed_at: datetime | None

    reviewed_by_user_id: int | None
    reviewed_by_name: str | None

    new_room_id: int | None
    new_room_number: str | None

    admin_note: str | None


class TransferAvailableRoomResponse(
    BaseModel
):
    id: int
    room_number: str

    block: str | None

    floor: int

    capacity: int
    occupied: int

    bathroom_type: str | None
    room_type: str | None

    yearly_fee: float | None

    specifications: str | None

    status: str