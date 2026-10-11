from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.allocation import RoomAllocation
from models.student import Student
from models.room import Room
from models.fee import Fee
from models.user import User
from schemas.allocation import AllocationCreate, AllocationResponse
from dependencies import require_roles


router = APIRouter(
    prefix="/allocations",
    tags=["Room Allocations"]
)


def get_academic_year(value: date) -> str:
    """
    Hostel academic year runs June to May.

    Examples:
    2026-10-03 -> 2026-27
    2027-03-10 -> 2026-27
    """
    if value.month >= 6:
        start_year = value.year
    else:
        start_year = value.year - 1

    end_year = start_year + 1

    return f"{start_year}-{str(end_year)[-2:]}"


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
    ).with_for_update().first()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    if student.admission_status != "Admitted":
        raise HTTPException(status_code=400, detail="Student must be admitted before room allocation")

    # Lock student first, then room: concurrent bookings serialize on both resources.
    # 2. Check whether room exists
    room = db.query(Room).filter(
        Room.id == allocation.room_id
    ).with_for_update().first()

    if not room:
        raise HTTPException(
            status_code=404,
            detail="Room not found"
        )

    # 3. Check whether student already has an active allocation
    existing_allocation = db.query(RoomAllocation).filter(
        RoomAllocation.student_id == allocation.student_id,
        RoomAllocation.status == "Active"
    ).with_for_update().first()

    if existing_allocation:
        raise HTTPException(
            status_code=400,
            detail="Student already has an active room allocation"
        )

    if room.status != "Available":
        raise HTTPException(
            status_code=400,
            detail="Room is not available for allocation"
        )

    if room.yearly_fee is None:
        raise HTTPException(
            status_code=400,
            detail=(
                "Yearly fee is not configured for this room. "
                "Set the room yearly fee before allocation."
            )
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
        allocation_date=allocation.allocation_date or date.today(),
        status="Active"
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

    # 9. Create/update yearly hostel fee automatically
    allocation_date = (
        new_allocation.allocation_date
        or date.today()
    )

    academic_year = get_academic_year(
        allocation_date
    )

    yearly_fee = db.query(Fee).filter(
        Fee.student_id == student.id,
        Fee.academic_year == academic_year,
        Fee.fee_type == "Hostel Room Fee"
    ).first()

    if yearly_fee is None:
        yearly_fee = Fee(
            student_id=student.id,
            room_id=room.id,
            academic_year=academic_year,
            fee_type="Hostel Room Fee",
            auto_generated=True,
            amount=float(room.yearly_fee),
            due_date=allocation_date,
            payment_date=None,
            status="Pending",
            payment_method=None,
            description=(
                f"Yearly hostel room fee - "
                f"{room.room_number} "
                f"({room.capacity}-Sharing) - "
                f"{academic_year}"
            )
        )

        db.add(yearly_fee)

    elif str(yearly_fee.status).strip().lower() != "paid":
        yearly_fee.room_id = room.id
        yearly_fee.amount = float(
            room.yearly_fee
        )
        yearly_fee.auto_generated = True

        yearly_fee.description = (
            f"Yearly hostel room fee - "
            f"{room.room_number} "
            f"({room.capacity}-Sharing) - "
            f"{academic_year}"
        )

    # 10. Save allocation + fee together
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
    # Read identifiers, then use the same lock order as allocation creation.
    reference = db.query(RoomAllocation).filter(RoomAllocation.id == allocation_id).first()
    if not reference:
        raise HTTPException(status_code=404, detail="Allocation not found")
    student = db.query(Student).filter(Student.id == reference.student_id).with_for_update().first()
    room = db.query(Room).filter(Room.id == reference.room_id).with_for_update().first()
    allocation = db.query(RoomAllocation).filter(
        RoomAllocation.id == allocation_id
    ).populate_existing().with_for_update().first()
    if allocation.status != "Active":
        raise HTTPException(status_code=400, detail="Allocation is already inactive")

    # 5. Decrease room occupancy
    if room and room.occupied > 0:
        room.occupied -= 1

        if room.status != "Maintenance":
            room.status = "Occupied" if room.occupied >= room.capacity else "Available"

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