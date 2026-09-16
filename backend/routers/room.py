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
    current_user: User = Depends(require_roles("Admin", "Warden"))
):
    existing_room = db.query(Room).filter(
        Room.room_number == room.room_number
    ).first()

    if existing_room:
        raise HTTPException(
            status_code=400,
            detail="Room number already exists"
        )

    new_room = Room(
        room_number=room.room_number,
        capacity=room.capacity,
        occupied=room.occupied,
        floor=room.floor,
        status=room.status
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


# GET ALL ROOMS
@router.get("/", response_model=list[RoomResponse])
def get_rooms(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Warden"))
):
    rooms = db.query(Room).all()
    return rooms


# GET ROOM BY ID
@router.get("/{room_id}", response_model=RoomResponse)
def get_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Warden"))
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
@router.put("/{room_id}", response_model=RoomResponse)
def update_room(
    room_id: int,
    room_data: RoomUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Warden"))
):
    room = db.query(Room).filter(
        Room.id == room_id
    ).first()

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

    room.room_number = room_data.room_number
    room.capacity = room_data.capacity
    room.occupied = room_data.occupied
    room.floor = room_data.floor
    room.status = room_data.status

    try:
        db.commit()
        db.refresh(room)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Room number already exists"
        )

    return room


# DELETE ROOM
@router.delete("/{room_id}")
def delete_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Warden"))
):
    room = db.query(Room).filter(
        Room.id == room_id
    ).first()

    if not room:
        raise HTTPException(
            status_code=404,
            detail="Room not found"
        )

    db.delete(room)
    db.commit()

    return {
        "message": "Room deleted successfully"
    }