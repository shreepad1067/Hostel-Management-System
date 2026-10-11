from datetime import (
    date,
    datetime,
    timezone,
)

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
)

from sqlalchemy.orm import Session

from database import get_db

from dependencies import (
    require_roles,
)

from models.allocation import (
    RoomAllocation,
)

from models.room import Room
from models.fee import Fee

from models.room_transfer import (
    RoomTransferRequest,
)

from models.student import Student

from models.user import User

from schemas.room_transfer import (
    RoomTransferCreate,
    RoomTransferResponse,
    RoomTransferReview,
    TransferAvailableRoomResponse,
)

from services.in_app_notification_service import (
    create_role_notifications,
    create_student_notification,
)


router = APIRouter(
    prefix="/room-transfers",
    tags=[
        "Room Transfers",
    ],
)


def utc_now():
    return (
        datetime.now(timezone.utc)
        .replace(tzinfo=None)
    )


def get_academic_year(value: date) -> str:
    """
    Hostel academic year runs June to May.
    Example:
    Oct 2026 -> 2026-27
    Mar 2027 -> 2026-27
    """
    if value.month >= 6:
        start_year = value.year
    else:
        start_year = value.year - 1

    return (
        f"{start_year}-"
        f"{str(start_year + 1)[-2:]}"
    )


# ======================================================
# HELPERS
# ======================================================

def get_student_for_user(
    db: Session,
    current_user: User,
) -> Student:

    student = (
        db.query(Student)
        .filter(
            Student.user_id
            == current_user.id
        )
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail=(
                "Student profile is not "
                "linked to this user"
            ),
        )

    return student


def get_active_allocation(
    db: Session,
    student_id: int,
    lock: bool = False,
) -> RoomAllocation | None:

    query = (
        db.query(RoomAllocation)
        .filter(
            RoomAllocation.student_id
            == student_id,

            RoomAllocation.status
            == "Active",
        )
    )

    if lock:
        query = (
            query.with_for_update()
        )

    return query.first()


def transfer_response(
    db: Session,
    transfer: RoomTransferRequest,
) -> dict:

    student = (
        db.query(Student)
        .filter(
            Student.id
            == transfer.student_id
        )
        .first()
    )

    current_room = (
        db.query(Room)
        .filter(
            Room.id
            == transfer.current_room_id
        )
        .first()
    )

    new_room = None

    if transfer.new_room_id:
        new_room = (
            db.query(Room)
            .filter(
                Room.id
                == transfer.new_room_id
            )
            .first()
        )

    reviewer = None

    if transfer.reviewed_by_user_id:
        reviewer = (
            db.query(User)
            .filter(
                User.id
                == transfer.reviewed_by_user_id
            )
            .first()
        )

    return {
        "id":
            transfer.id,

        "student_id":
            transfer.student_id,

        "student_name":
            (
                student.name
                if student
                else "Student"
            ),

        "student_code":
            (
                student.student_code
                if student
                else None
            ),

        "current_room_id":
            transfer.current_room_id,

        "current_room_number":
            (
                current_room.room_number
                if current_room
                else "Unknown"
            ),

        "preferred_sharing":
            transfer.preferred_sharing,

        "reason":
            transfer.reason,

        "status":
            transfer.status,

        "requested_at":
            transfer.requested_at,

        "reviewed_at":
            transfer.reviewed_at,

        "reviewed_by_user_id":
            transfer.reviewed_by_user_id,

        "reviewed_by_name":
            (
                reviewer.full_name
                or reviewer.username
                if reviewer
                else None
            ),

        "new_room_id":
            transfer.new_room_id,

        "new_room_number":
            (
                new_room.room_number
                if new_room
                else None
            ),

        "admin_note":
            transfer.admin_note,
    }


# ======================================================
# STUDENT — CREATE ROOM TRANSFER REQUEST
# ======================================================

@router.post(
    "/",
    response_model=
        RoomTransferResponse,
)
def create_transfer_request(
    payload: RoomTransferCreate,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_roles(
            "Student"
        )
    ),
):

    student = (
        db.query(Student)
        .filter(
            Student.user_id
            == current_user.id
        )
        .with_for_update()
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail=(
                "Student profile is not "
                "linked to this user"
            ),
        )

    if (
        student.admission_status
        != "Admitted"
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Only admitted students "
                "can request a room transfer"
            ),
        )

    allocation = (
        get_active_allocation(
            db,
            student.id,
            lock=True,
        )
    )

    if not allocation:
        raise HTTPException(
            status_code=400,
            detail=(
                "You need an active room "
                "allocation before requesting "
                "a transfer"
            ),
        )

    current_room = (
        db.query(Room)
        .filter(
            Room.id
            == allocation.room_id
        )
        .first()
    )

    if not current_room:
        raise HTTPException(
            status_code=404,
            detail=(
                "Current room could "
                "not be found"
            ),
        )

    pending_request = (
        db.query(
            RoomTransferRequest
        )
        .filter(
            RoomTransferRequest.student_id
            == student.id,

            RoomTransferRequest.status
            == "Pending",
        )
        .first()
    )

    if pending_request:
        raise HTTPException(
            status_code=400,
            detail=(
                "You already have a pending "
                "room transfer request"
            ),
        )

    reason = (
        payload.reason.strip()
    )

    if len(reason) < 5:
        raise HTTPException(
            status_code=400,
            detail=(
                "Please provide a valid "
                "reason for the transfer"
            ),
        )

    transfer = (
        RoomTransferRequest(
            student_id=
                student.id,

            current_room_id=
                current_room.id,

            preferred_sharing=
                payload
                .preferred_sharing,

            reason=
                reason,

            status=
                "Pending",
        )
    )

    db.add(
        transfer
    )

    db.flush()

    create_role_notifications(
        db=db,

        roles=[
            "Admin",
            "Warden",
        ],

        title=
            "New room transfer request",

        message=(
            f"{student.name} requested "
            f"a transfer from room "
            f"{current_room.room_number} "
            f"to a "
            f"{payload.preferred_sharing}"
            f"-sharing room."
        ),

        category=
            "Room Transfer",

        level=
            "Info",

        link=
            "/room-transfer",
    )

    db.commit()

    db.refresh(
        transfer
    )

    return transfer_response(
        db,
        transfer,
    )


# ======================================================
# STUDENT — MY ROOM TRANSFER REQUESTS
# ======================================================

@router.get(
    "/my",
    response_model=
        list[
            RoomTransferResponse
        ],
)
def get_my_transfer_requests(
    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_roles(
            "Student"
        )
    ),
):

    student = (
        get_student_for_user(
            db,
            current_user,
        )
    )

    requests = (
        db.query(
            RoomTransferRequest
        )
        .filter(
            RoomTransferRequest.student_id
            == student.id
        )
        .order_by(
            RoomTransferRequest
            .requested_at
            .desc()
        )
        .all()
    )

    return [
        transfer_response(
            db,
            item,
        )
        for item in requests
    ]


# ======================================================
# STUDENT — CANCEL PENDING REQUEST
# ======================================================

@router.delete(
    "/{transfer_id}/cancel",
    response_model=
        RoomTransferResponse,
)
def cancel_transfer_request(
    transfer_id: int,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_roles(
            "Student"
        )
    ),
):

    student = (
        get_student_for_user(
            db,
            current_user,
        )
    )

    transfer = (
        db.query(
            RoomTransferRequest
        )
        .filter(
            RoomTransferRequest.id
            == transfer_id,

            RoomTransferRequest.student_id
            == student.id,
        )
        .with_for_update()
        .first()
    )

    if not transfer:
        raise HTTPException(
            status_code=404,
            detail=(
                "Room transfer request "
                "not found"
            ),
        )

    if (
        transfer.status
        != "Pending"
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Only pending room transfer "
                "requests can be cancelled"
            ),
        )

    transfer.status = (
        "Cancelled"
    )

    db.commit()

    db.refresh(
        transfer
    )

    return transfer_response(
        db,
        transfer,
    )


# ======================================================
# ADMIN/WARDEN — ALL TRANSFER REQUESTS
# ======================================================

@router.get(
    "/",
    response_model=
        list[
            RoomTransferResponse
        ],
)
def get_transfer_requests(
    status: str | None = Query(
        default=None
    ),

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_roles(
            "Admin",
            "Warden",
        )
    ),
):

    query = (
        db.query(
            RoomTransferRequest
        )
    )

    if status:
        query = query.filter(
            RoomTransferRequest.status
            == status
        )

    requests = (
        query
        .order_by(
            RoomTransferRequest
            .requested_at
            .desc()
        )
        .all()
    )

    return [
        transfer_response(
            db,
            item,
        )
        for item in requests
    ]


# ======================================================
# ADMIN/WARDEN — AVAILABLE ROOMS FOR REQUEST
# ======================================================

@router.get(
    "/{transfer_id}/available-rooms",
    response_model=
        list[
            TransferAvailableRoomResponse
        ],
)
def get_transfer_available_rooms(
    transfer_id: int,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_roles(
            "Admin",
            "Warden",
        )
    ),
):

    transfer = (
        db.query(
            RoomTransferRequest
        )
        .filter(
            RoomTransferRequest.id
            == transfer_id
        )
        .first()
    )

    if not transfer:
        raise HTTPException(
            status_code=404,
            detail=(
                "Room transfer request "
                "not found"
            ),
        )

    if (
        transfer.status
        != "Pending"
    ):
        return []

    rooms = (
        db.query(Room)
        .filter(
            Room.capacity
            == transfer
            .preferred_sharing,

            Room.id
            != transfer
            .current_room_id,

            Room.status
            == "Available",

            Room.occupied
            < Room.capacity,
        )
        .order_by(
            Room.block,
            Room.floor,
            Room.room_number,
        )
        .all()
    )

    return rooms


# ======================================================
# ADMIN/WARDEN — APPROVE / REJECT REQUEST
# ======================================================

@router.put(
    "/{transfer_id}/review",
    response_model=
        RoomTransferResponse,
)
def review_transfer_request(
    transfer_id: int,

    payload: RoomTransferReview,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_roles(
            "Admin",
            "Warden",
        )
    ),
):

    transfer = (
        db.query(
            RoomTransferRequest
        )
        .filter(
            RoomTransferRequest.id
            == transfer_id
        )
        .with_for_update()
        .first()
    )

    if not transfer:
        raise HTTPException(
            status_code=404,
            detail=(
                "Room transfer request "
                "not found"
            ),
        )

    if (
        transfer.status
        != "Pending"
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "This room transfer "
                "request has already "
                "been reviewed"
            ),
        )

    admin_note = (
        payload.admin_note.strip()
        if payload.admin_note
        else None
    )


    # --------------------------------------------------
    # REJECT REQUEST
    # --------------------------------------------------

    if (
        payload.decision
        == "Rejected"
    ):

        transfer.status = (
            "Rejected"
        )

        transfer.admin_note = (
            admin_note
        )

        transfer.reviewed_at = (
            utc_now()
        )

        transfer.reviewed_by_user_id = (
            current_user.id
        )

        create_student_notification(
            db=db,

            student_id=
                transfer.student_id,

            title=
                "Room transfer request reviewed",

            message=(
                "Your room transfer "
                "request was not approved."
                + (
                    f" Note: {admin_note}"
                    if admin_note
                    else ""
                )
            ),

            category=
                "Room Transfer",

            level=
                "Info",

            link=
                "/room-transfer",
        )

        db.commit()

        db.refresh(
            transfer
        )

        return transfer_response(
            db,
            transfer,
        )


    # --------------------------------------------------
    # APPROVAL REQUIRES TARGET ROOM
    # --------------------------------------------------

    if (
        payload.new_room_id
        is None
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Select a new room "
                "before approving "
                "the request"
            ),
        )


    # --------------------------------------------------
    # LOCK STUDENT
    # --------------------------------------------------

    student = (
        db.query(Student)
        .filter(
            Student.id
            == transfer.student_id
        )
        .with_for_update()
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail=(
                "Student not found"
            ),
        )


    # --------------------------------------------------
    # LOCK CURRENT ACTIVE ALLOCATION
    # --------------------------------------------------

    allocation = (
        get_active_allocation(
            db,
            student.id,
            lock=True,
        )
    )

    if not allocation:
        raise HTTPException(
            status_code=409,
            detail=(
                "The student no longer "
                "has an active room "
                "allocation"
            ),
        )

    if (
        allocation.room_id
        != transfer.current_room_id
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "The student's current room "
                "has changed since this "
                "request was created"
            ),
        )


    # --------------------------------------------------
    # LOCK OLD AND NEW ROOMS IN ID ORDER
    # --------------------------------------------------

    room_ids = sorted(
        {
            transfer.current_room_id,
            payload.new_room_id,
        }
    )

    locked_rooms = (
        db.query(Room)
        .filter(
            Room.id.in_(
                room_ids
            )
        )
        .order_by(
            Room.id
        )
        .with_for_update()
        .all()
    )

    room_map = {
        room.id:
            room
        for room in locked_rooms
    }

    old_room = (
        room_map.get(
            transfer.current_room_id
        )
    )

    new_room = (
        room_map.get(
            payload.new_room_id
        )
    )

    if not old_room:
        raise HTTPException(
            status_code=404,
            detail=(
                "Current room not found"
            ),
        )

    if not new_room:
        raise HTTPException(
            status_code=404,
            detail=(
                "Selected new room "
                "not found"
            ),
        )

    if (
        old_room.id
        == new_room.id
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "The new room must be "
                "different from the "
                "current room"
            ),
        )

    if new_room.yearly_fee is None:
        raise HTTPException(
            status_code=400,
            detail=(
                "Yearly fee is not configured "
                "for the selected room"
            ),
        )


    if (
        new_room.capacity
        != transfer
        .preferred_sharing
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Selected room does not "
                "match the student's "
                "preferred sharing type"
            ),
        )

    if (
        new_room.status
        != "Available"
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Selected room is not "
                "available"
            ),
        )

    if (
        new_room.occupied
        >= new_room.capacity
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Selected room is full"
            ),
        )


    # --------------------------------------------------
    # REMOVE STUDENT FROM OLD ROOM
    # --------------------------------------------------

    if (
        old_room.occupied > 0
    ):
        old_room.occupied -= 1

    if (
        old_room.status
        != "Maintenance"
    ):
        old_room.status = (
            "Occupied"
            if old_room.occupied
            >= old_room.capacity
            else "Available"
        )


    # --------------------------------------------------
    # PRESERVE OLD ALLOCATION IN HISTORY
    # --------------------------------------------------

    allocation.status = (
        "Transferred"
    )


    # --------------------------------------------------
    # CREATE NEW ACTIVE ALLOCATION
    # --------------------------------------------------

    new_allocation = (
        RoomAllocation(
            student_id=
                student.id,

            room_id=
                new_room.id,

            allocation_date=
                date.today(),

            status=
                "Active",
        )
    )

    db.add(
        new_allocation
    )


    # --------------------------------------------------
    # UPDATE NEW ROOM OCCUPANCY
    # --------------------------------------------------

    new_room.occupied += 1

    if (
        new_room.occupied
        >= new_room.capacity
    ):
        new_room.status = (
            "Occupied"
        )

    else:
        new_room.status = (
            "Available"
        )


    # --------------------------------------------------
    # UPDATE STUDENT
    # --------------------------------------------------

    student.room_number = (
        new_room.room_number
    )


    # --------------------------------------------------
    # RECONCILE YEARLY HOSTEL FEE
    # --------------------------------------------------

    transfer_date = date.today()

    academic_year = (
        get_academic_year(
            transfer_date
        )
    )

    yearly_fee = (
        db.query(Fee)
        .filter(
            Fee.student_id
            == student.id,

            Fee.academic_year
            == academic_year,

            Fee.fee_type
            == "Hostel Room Fee",
        )
        .with_for_update()
        .first()
    )


    # No yearly fee exists:
    # create it for the new room.
    if yearly_fee is None:

        yearly_fee = Fee(
            student_id=
                student.id,

            room_id=
                new_room.id,

            academic_year=
                academic_year,

            fee_type=
                "Hostel Room Fee",

            auto_generated=
                True,

            amount=
                float(
                    new_room.yearly_fee
                ),

            due_date=
                transfer_date,

            payment_date=
                None,

            status=
                "Pending",

            payment_method=
                None,

            description=(
                f"Yearly hostel room fee - "
                f"{new_room.room_number} "
                f"({new_room.capacity}-Sharing) - "
                f"{academic_year}"
            ),
        )

        db.add(
            yearly_fee
        )


    # Existing unpaid yearly fee:
    # move it to the new room and use
    # the new room's yearly fee.
    elif (
        str(
            yearly_fee.status
        )
        .strip()
        .lower()
        != "paid"
    ):

        yearly_fee.room_id = (
            new_room.id
        )

        yearly_fee.amount = (
            float(
                new_room.yearly_fee
            )
        )

        yearly_fee.auto_generated = (
            True
        )

        yearly_fee.description = (
            f"Yearly hostel room fee - "
            f"{new_room.room_number} "
            f"({new_room.capacity}-Sharing) - "
            f"{academic_year}"
        )


    # If already Paid:
    # preserve the old paid fee and receipt.
    # We do not silently modify a paid receipt.


    # --------------------------------------------------
    # COMPLETE TRANSFER REQUEST
    # --------------------------------------------------

    transfer.status = (
        "Approved"
    )

    transfer.new_room_id = (
        new_room.id
    )

    transfer.admin_note = (
        admin_note
    )

    transfer.reviewed_at = (
        utc_now()
    )

    transfer.reviewed_by_user_id = (
        current_user.id
    )


    # --------------------------------------------------
    # STUDENT NOTIFICATION
    # --------------------------------------------------

    create_student_notification(
        db=db,

        student_id=
            student.id,

        title=
            "Room transfer approved",

        message=(
            f"Your room has been "
            f"transferred from "
            f"{old_room.room_number} "
            f"to "
            f"{new_room.room_number}."
        ),

        category=
            "Room Transfer",

        level=
            "Success",

        link=
            "/my-room",
    )


    # --------------------------------------------------
    # SAVE TRANSACTION
    # --------------------------------------------------

    db.commit()

    db.refresh(
        transfer
    )

    return transfer_response(
        db,
        transfer,
    )