from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from models.room import Room
from models.student import Student
from models.allocation import RoomAllocation
from models.user import User
from schemas.room import RoomCreate, RoomUpdate, RoomResponse
from dependencies import require_roles


router = APIRouter(
    prefix="/rooms",
    tags=["Rooms"]
)


# CREATE ROOM
@router.post("/", response_model=RoomResponse)
def create_room(
    room: RoomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin", "Warden")
    )
):
    existing_room = db.query(Room).filter(
        Room.room_number == room.room_number
    ).first()

    if existing_room:
        raise HTTPException(
            status_code=400,
            detail="Room number already exists"
        )

    if room.capacity < 1 or room.capacity > 4:
        raise HTTPException(
            status_code=400,
            detail="Room capacity must be between 1 and 4"
        )

    if room.occupied < 0:
        raise HTTPException(
            status_code=400,
            detail="Occupied beds cannot be negative"
        )

    if room.occupied > room.capacity:
        raise HTTPException(
            status_code=400,
            detail="Occupied beds cannot exceed room capacity"
        )

    if room.occupied != 0:
        raise HTTPException(status_code=400, detail="New rooms must be empty; use room allocation to add occupants")

    new_room = Room(
        room_number=room.room_number.strip(),
        block=room.block.strip() if room.block else None,
        capacity=room.capacity,
        occupied=room.occupied,
        floor=room.floor,
        bathroom_type=(
            room.bathroom_type.strip()
            if room.bathroom_type
            else None
        ),
        room_type=(
            room.room_type.strip()
            if room.room_type
            else None
        ),
        monthly_fee=room.monthly_fee,
        specifications=(
            room.specifications.strip()
            if room.specifications
            else None
        ),
        status="Maintenance" if room.status == "Maintenance" else "Available"
    )

    db.add(new_room)

    try:
        db.commit()
        db.refresh(new_room)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Room number already exists"
        )

    return new_room


# GET MY ROOM
@router.get(
    "/my-room",
    response_model=RoomResponse
)
def get_my_room(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Student")
    )
):
    student = db.query(Student).filter(
        Student.user_id == current_user.id
    ).first()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student profile is not linked to this user"
        )

    allocation = db.query(RoomAllocation).filter(
        RoomAllocation.student_id == student.id,
        RoomAllocation.status == "Active"
    ).first()

    if not allocation:
        raise HTTPException(
            status_code=404,
            detail="No active room allocation found"
        )

    room = db.query(Room).filter(
        Room.id == allocation.room_id
    ).first()

    if not room:
        raise HTTPException(
            status_code=404,
            detail="Allocated room not found"
        )

    return room


# GET AVAILABLE ROOMS BY SHARING TYPE
@router.get(
    "/available/{capacity}",
    response_model=list[RoomResponse]
)
def get_available_rooms_by_capacity(
    capacity: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin", "Warden")
    )
):
    if capacity < 1 or capacity > 4:
        raise HTTPException(
            status_code=400,
            detail="Sharing type must be between 1 and 4"
        )

    rooms = db.query(Room).filter(
        Room.capacity == capacity,
        Room.occupied < Room.capacity,
        Room.status == "Available"
    ).order_by(
        Room.block,
        Room.floor,
        Room.room_number
    ).all()

    return rooms


# GET ALL ROOMS
@router.get(
    "/",
    response_model=list[RoomResponse]
)
def get_rooms(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin", "Warden")
    )
):
    return db.query(Room).all()


# GET ROOM BY ID
@router.get(
    "/{room_id}",
    response_model=RoomResponse
)
def get_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin", "Warden")
    )
):
    room = db.query(Room).filter(
        Room.id == room_id
    ).first()

    if not room:
        raise HTTPException(
            status_code=404,
            detail="Room not found"
        )

    return room


# UPDATE ROOM
@router.put(
    "/{room_id}",
    response_model=RoomResponse
)
def update_room(
    room_id: int,
    room_data: RoomUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin", "Warden")
    )
):
    room = db.query(Room).filter(
        Room.id == room_id
    ).with_for_update().first()

    if not room:
        raise HTTPException(
            status_code=404,
            detail="Room not found"
        )

    existing_room = db.query(Room).filter(
        Room.room_number == room_data.room_number,
        Room.id != room_id
    ).first()

    if existing_room:
        raise HTTPException(
            status_code=400,
            detail="Room number already exists"
        )

    if room_data.capacity < 1 or room_data.capacity > 4:
        raise HTTPException(
            status_code=400,
            detail="Room capacity must be between 1 and 4"
        )

    if room_data.occupied < 0:
        raise HTTPException(
            status_code=400,
            detail="Occupied beds cannot be negative"
        )

    if room_data.occupied > room_data.capacity:
        raise HTTPException(
            status_code=400,
            detail="Occupied beds cannot exceed room capacity"
        )

    if room_data.occupied != room.occupied:
        raise HTTPException(status_code=409, detail="Occupancy changed or was edited. Reload rooms; use allocation to change occupants")
    if room_data.capacity < room.occupied:
        raise HTTPException(status_code=400, detail="Capacity cannot be lower than current occupancy")
    if room_data.room_number != room.room_number and room.occupied:
        raise HTTPException(status_code=400, detail="Deallocate occupants before renaming a room")

    # Older clients omit specifications: preserve those values unless explicitly supplied.
    for field, value in room_data.model_dump(exclude_unset=True).items():
        if field not in {"occupied", "status"}:
            setattr(room, field, value)
    room.status = (
        "Maintenance" if room_data.status == "Maintenance"
        else "Occupied" if room.occupied >= room.capacity else "Available"
    )

    try:
        db.commit()
        db.refresh(room)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Could not update room"
        )

    return room


# DELETE ROOM
@router.delete("/{room_id}")
def delete_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin", "Warden")
    )
):
    room = db.query(Room).filter(
        Room.id == room_id
    ).with_for_update().first()

    if not room:
        raise HTTPException(
            status_code=404,
            detail="Room not found"
        )

    if room.occupied or db.query(RoomAllocation.id).filter(RoomAllocation.room_id == room_id).first():
        raise HTTPException(status_code=409, detail="Rooms with occupancy or allocation history cannot be deleted; use Maintenance")

    db.delete(room)
    db.commit()

    return {
        "message": "Room deleted successfully"
    }