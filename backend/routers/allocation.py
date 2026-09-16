from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.allocation import RoomAllocation
from models.student import Student
from models.room import Room
from models.user import User
from schemas.allocation import AllocationCreate, AllocationResponse
from dependencies import require_roles


router = APIRouter(
    prefix="/allocations",
    tags=["Room Allocations"]
)


# CREATE ALLOCATION
# Admin/Warden only
@router.post("/", response_model=AllocationResponse)
def create_allocation(
    allocation: AllocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin", "Warden")
    )
):
    # 1. Check whether student exists
    student = db.query(Student).filter(
        Student.id == allocation.student_id
    ).first()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    # 2. Check whether room exists
    room = db.query(Room).filter(
        Room.id == allocation.room_id
    ).first()

    if not room:
        raise HTTPException(
            status_code=404,
            detail="Room not found"
        )

    # 3. Check whether student already has an active allocation
    existing_allocation = db.query(RoomAllocation).filter(
        RoomAllocation.student_id == allocation.student_id,
        RoomAllocation.status == "Active"
    ).first()

    if existing_allocation:
        raise HTTPException(
            status_code=400,
            detail="Student already has an active room allocation"
        )

    # 4. Check room capacity
    if room.occupied >= room.capacity:
        raise HTTPException(
            status_code=400,
            detail="Room is full"
        )

    # 5. Create allocation
    new_allocation = RoomAllocation(
        student_id=allocation.student_id,
        room_id=allocation.room_id,
        allocation_date=allocation.allocation_date,
        status=allocation.status
    )

    db.add(new_allocation)

    # 6. Increase occupied count
    room.occupied += 1

    # 7. Update room status
    if room.occupied >= room.capacity:
        room.status = "Occupied"
    else:
        room.status = "Available"

    # 8. Update student's room number
    student.room_number = room.room_number

    # 9. Save everything
    db.commit()
    db.refresh(new_allocation)

    return new_allocation


# GET ALL ALLOCATIONS
# Admin/Warden only
@router.get("/", response_model=list[AllocationResponse])
def get_allocations(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin", "Warden")
    )
):
    allocations = db.query(RoomAllocation).all()

    return allocations


# GET CURRENT STUDENT'S ROOM ALLOCATION
# Student only
@router.get(
    "/my-room",
    response_model=AllocationResponse
)
def get_my_room(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Student")
    )
):
    # Find the Student profile linked to the logged-in user
    student = db.query(Student).filter(
        Student.user_id == current_user.id
    ).first()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student profile is not linked to this user"
        )

    # Find the student's active room allocation
    allocation = db.query(RoomAllocation).filter(
        RoomAllocation.student_id == student.id,
        RoomAllocation.status == "Active"
    ).first()

    if not allocation:
        raise HTTPException(
            status_code=404,
            detail="No active room allocation found"
        )

    return allocation


# GET ALLOCATION BY ID
# Admin/Warden only
@router.get(
    "/{allocation_id}",
    response_model=AllocationResponse
)
def get_allocation(
    allocation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin", "Warden")
    )
):
    allocation = db.query(RoomAllocation).filter(
        RoomAllocation.id == allocation_id
    ).first()

    if not allocation:
        raise HTTPException(
            status_code=404,
            detail="Allocation not found"
        )

    return allocation


# DELETE / DEACTIVATE ALLOCATION
# Admin/Warden only
@router.delete("/{allocation_id}")
def delete_allocation(
    allocation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin", "Warden")
    )
):
    # 1. Find allocation
    allocation = db.query(RoomAllocation).filter(
        RoomAllocation.id == allocation_id
    ).first()

    if not allocation:
        raise HTTPException(
            status_code=404,
            detail="Allocation not found"
        )

    # 2. Prevent repeated deallocation
    if allocation.status == "Inactive":
        raise HTTPException(
            status_code=400,
            detail="Allocation is already inactive"
        )

    # 3. Find the room
    room = db.query(Room).filter(
        Room.id == allocation.room_id
    ).first()

    # 4. Find the student
    student = db.query(Student).filter(
        Student.id == allocation.student_id
    ).first()

    # 5. Decrease room occupancy
    if room and room.occupied > 0:
        room.occupied -= 1

        if room.occupied >= room.capacity:
            room.status = "Occupied"
        else:
            room.status = "Available"

    # 6. Clear student's room number
    if student:
        student.room_number = None

    # 7. Mark allocation as inactive
    allocation.status = "Inactive"

    # 8. Save changes
    db.commit()

    return {
        "message": "Allocation deleted successfully"
    }