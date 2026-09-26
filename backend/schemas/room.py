from decimal import Decimal
from typing import Optional, Literal

from pydantic import BaseModel, ConfigDict, Field


class RoomCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    room_number: str = Field(min_length=1, max_length=20)
    block: Optional[str] = Field(default=None, max_length=50)
    capacity: int = Field(ge=1, le=4)
    occupied: int = Field(default=0, ge=0)
    floor: int = Field(ge=0)
    bathroom_type: Optional[str] = Field(default=None, max_length=50)
    room_type: Optional[str] = Field(default=None, max_length=50)
    monthly_fee: Optional[Decimal] = Field(default=None, ge=0, max_digits=10, decimal_places=2)
    specifications: Optional[str] = Field(default=None, max_length=500)
    status: Literal["Available", "Occupied", "Maintenance"] = "Available"


class RoomUpdate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    room_number: str = Field(min_length=1, max_length=20)
    block: Optional[str] = Field(default=None, max_length=50)
    capacity: int = Field(ge=1, le=4)
    occupied: int = Field(ge=0)
    floor: int = Field(ge=0)
    bathroom_type: Optional[str] = Field(default=None, max_length=50)
    room_type: Optional[str] = Field(default=None, max_length=50)
    monthly_fee: Optional[Decimal] = Field(default=None, ge=0, max_digits=10, decimal_places=2)
    specifications: Optional[str] = Field(default=None, max_length=500)
    status: Literal["Available", "Occupied", "Maintenance"]


class RoomResponse(BaseModel):
    id: int
    room_number: str
    block: Optional[str] = None
    capacity: int
    occupied: int
    floor: int
    bathroom_type: Optional[str] = None
    room_type: Optional[str] = None
    monthly_fee: Optional[Decimal] = None
    specifications: Optional[str] = None
    status: str

    model_config = {
        "from_attributes": True
    }