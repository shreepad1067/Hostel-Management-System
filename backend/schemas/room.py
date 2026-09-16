from pydantic import BaseModel


class RoomCreate(BaseModel):
    room_number: str
    capacity: int
    occupied: int = 0
    floor: int
    status: str = "Available"


class RoomUpdate(BaseModel):
    room_number: str
    capacity: int
    occupied: int
    floor: int
    status: str


class RoomResponse(BaseModel):
    id: int
    room_number: str
    capacity: int
    occupied: int
    floor: int
    status: str

    model_config = {
        "from_attributes": True
    }