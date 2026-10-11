from datetime import (
    datetime,
    timezone,
)

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy.orm import Session

from database import get_db

from dependencies import (
    require_roles,
)

from models.allocation import (
    RoomAllocation,
)

from models.maintenance import (
    MaintenanceWorkOrder,
)

from models.room import Room

from models.student import Student

from models.user import User

from schemas.maintenance import (
    MaintenanceCreate,
    MaintenanceResponse,
    MaintenanceUpdate,
)

from services.in_app_notification_service import (
    create_role_notifications,
    create_student_notification,
)


router = APIRouter(
    prefix="/maintenance",
    tags=[
        "Maintenance",
    ],
)


def utc_now():
    return (
        datetime.now(timezone.utc)
        .replace(tzinfo=None)
    )


# =====================================================
# HELPERS
# =====================================================

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


def get_student_active_room(
    db: Session,
    student_id: int,
) -> Room | None:

    allocation = (
        db.query(RoomAllocation)
        .filter(
            RoomAllocation.student_id
            == student_id,

            RoomAllocation.status
            == "Active",
        )
        .first()
    )

    if not allocation:
        return None

    return (
        db.query(Room)
        .filter(
            Room.id
            == allocation.room_id
        )
        .first()
    )


def work_order_response(
    db: Session,
    item: MaintenanceWorkOrder,
) -> dict:

    student = None
    room = None

    if item.student_id:
        student = (
            db.query(Student)
            .filter(
                Student.id
                == item.student_id
            )
            .first()
        )

    if item.room_id:
        room = (
            db.query(Room)
            .filter(
                Room.id
                == item.room_id
            )
            .first()
        )

    creator = (
        db.query(User)
        .filter(
            User.id
            == item.created_by_user_id
        )
        .first()
    )

    return {
        "id":
            item.id,

        "work_order_number":
            f"WO-{item.id:05d}",

        "student_id":
            item.student_id,

        "student_name":
            (
                student.name
                if student
                else None
            ),

        "student_code":
            (
                student.student_code
                if student
                else None
            ),

        "room_id":
            item.room_id,

        "room_number":
            (
                room.room_number
                if room
                else None
            ),

        "block":
            (
                room.block
                if room
                else None
            ),

        "floor":
            (
                room.floor
                if room
                else None
            ),

        "created_by_user_id":
            item.created_by_user_id,

        "created_by_name":
            (
                (
                    creator.full_name
                    or creator.username
                )
                if creator
                else "User"
            ),

        "title":
            item.title,

        "description":
            item.description,

        "category":
            item.category,

        "priority":
            item.priority,

        "status":
            item.status,

        "assigned_to":
            item.assigned_to,

        "assigned_contact":
            item.assigned_contact,

        "scheduled_date":
            item.scheduled_date,

        "resolution":
            item.resolution,

        "completed_at":
            item.completed_at,

        "created_at":
            item.created_at,

        "updated_at":
            item.updated_at,
    }


# =====================================================
# CREATE WORK ORDER
# Student:
#   Automatically links their own room.
#
# Admin/Warden:
#   Can create for a student/room or
#   create a general hostel work order.
# =====================================================

@router.post(
    "/",
    response_model=
        MaintenanceResponse,
)
def create_work_order(
    payload: MaintenanceCreate,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_roles(
            "Admin",
            "Warden",
            "Student",
        )
    ),
):

    student_id = None
    room_id = None


    # -------------------------------------------------
    # STUDENT REQUEST
    # -------------------------------------------------

    if (
        current_user.role
        == "Student"
    ):

        student = (
            get_student_for_user(
                db,
                current_user,
            )
        )

        room = (
            get_student_active_room(
                db,
                student.id,
            )
        )

        if not room:
            raise HTTPException(
                status_code=400,
                detail=(
                    "You need an active "
                    "room allocation before "
                    "reporting a room "
                    "maintenance issue"
                ),
            )

        student_id = (
            student.id
        )

        room_id = (
            room.id
        )


    # -------------------------------------------------
    # ADMIN / WARDEN CREATED WORK ORDER
    # -------------------------------------------------

    else:

        if (
            payload.student_id
            is not None
        ):

            student = (
                db.query(Student)
                .filter(
                    Student.id
                    == payload.student_id
                )
                .first()
            )

            if not student:
                raise HTTPException(
                    status_code=404,
                    detail=(
                        "Student not found"
                    ),
                )

            student_id = (
                student.id
            )


        if (
            payload.room_id
            is not None
        ):

            room = (
                db.query(Room)
                .filter(
                    Room.id
                    == payload.room_id
                )
                .first()
            )

            if not room:
                raise HTTPException(
                    status_code=404,
                    detail=(
                        "Room not found"
                    ),
                )

            room_id = (
                room.id
            )


        # If management selected student
        # but not room, use student's
        # active room automatically.

        if (
            student_id
            and room_id is None
        ):

            student_room = (
                get_student_active_room(
                    db,
                    student_id,
                )
            )

            if student_room:
                room_id = (
                    student_room.id
                )


    title = (
        payload.title.strip()
    )

    description = (
        payload.description.strip()
    )


    work_order = (
        MaintenanceWorkOrder(
            student_id=
                student_id,

            room_id=
                room_id,

            created_by_user_id=
                current_user.id,

            title=
                title,

            description=
                description,

            category=
                payload.category,

            priority=
                payload.priority,

            status=
                "Open",
        )
    )

    db.add(
        work_order
    )

    db.flush()


    # -------------------------------------------------
    # STUDENT CREATED -> ADMIN/WARDEN NOTIFICATION
    # -------------------------------------------------

    if (
        current_user.role
        == "Student"
    ):

        create_role_notifications(
            db=db,

            roles=[
                "Admin",
                "Warden",
            ],

            title=
                "New maintenance request",

            message=(
                f"{student.name} reported "
                f"a {payload.category.lower()} "
                f"issue in room "
                f"{room.room_number}: "
                f"{title}"
            ),

            category=
                "Maintenance",

            level=(
                "Warning"
                if payload.priority
                in [
                    "High",
                    "Urgent",
                ]
                else "Info"
            ),

            link=
                "/maintenance",
        )


    # -------------------------------------------------
    # MANAGEMENT CREATED FOR STUDENT
    # -------------------------------------------------

    elif student_id:

        create_student_notification(
            db=db,

            student_id=
                student_id,

            title=
                "Maintenance work order created",

            message=(
                f"A maintenance work order "
                f"has been created: "
                f"{title}."
            ),

            category=
                "Maintenance",

            level=
                "Info",

            link=
                "/maintenance",
        )


    db.commit()

    db.refresh(
        work_order
    )


    return work_order_response(
        db,
        work_order,
    )


# =====================================================
# GET WORK ORDERS
#
# Admin/Warden:
#   All work orders.
#
# Student:
#   Only work orders connected to them.
# =====================================================

@router.get(
    "/",
    response_model=
        list[
            MaintenanceResponse
        ],
)
def get_work_orders(
    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_roles(
            "Admin",
            "Warden",
            "Student",
        )
    ),
):

    query = (
        db.query(
            MaintenanceWorkOrder
        )
    )


    if (
        current_user.role
        == "Student"
    ):

        student = (
            get_student_for_user(
                db,
                current_user,
            )
        )

        query = query.filter(
            MaintenanceWorkOrder.student_id
            == student.id
        )


    items = (
        query
        .order_by(
            MaintenanceWorkOrder
            .created_at
            .desc()
        )
        .all()
    )


    return [
        work_order_response(
            db,
            item,
        )
        for item in items
    ]


# =====================================================
# GET ONE WORK ORDER
# =====================================================

@router.get(
    "/{work_order_id}",
    response_model=
        MaintenanceResponse,
)
def get_work_order(
    work_order_id: int,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_roles(
            "Admin",
            "Warden",
            "Student",
        )
    ),
):

    item = (
        db.query(
            MaintenanceWorkOrder
        )
        .filter(
            MaintenanceWorkOrder.id
            == work_order_id
        )
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail=(
                "Maintenance work order "
                "not found"
            ),
        )


    if (
        current_user.role
        == "Student"
    ):

        student = (
            get_student_for_user(
                db,
                current_user,
            )
        )

        if (
            item.student_id
            != student.id
        ):
            raise HTTPException(
                status_code=403,
                detail=(
                    "You do not have "
                    "permission to access "
                    "this work order"
                ),
            )


    return work_order_response(
        db,
        item,
    )


# =====================================================
# ADMIN / WARDEN UPDATE WORK ORDER
# =====================================================

@router.put(
    "/{work_order_id}",
    response_model=
        MaintenanceResponse,
)
def update_work_order(
    work_order_id: int,

    payload: MaintenanceUpdate,

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

    item = (
        db.query(
            MaintenanceWorkOrder
        )
        .filter(
            MaintenanceWorkOrder.id
            == work_order_id
        )
        .with_for_update()
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail=(
                "Maintenance work order "
                "not found"
            ),
        )


    old_status = (
        item.status
    )

    old_assignee = (
        item.assigned_to
    )


    update_data = (
        payload.model_dump(
            exclude_unset=True
        )
    )


    if (
        "assigned_to"
        in update_data
    ):
        value = (
            update_data[
                "assigned_to"
            ]
        )

        update_data[
            "assigned_to"
        ] = (
            value.strip()
            if value
            else None
        )


    if (
        "assigned_contact"
        in update_data
    ):
        value = (
            update_data[
                "assigned_contact"
            ]
        )

        update_data[
            "assigned_contact"
        ] = (
            value.strip()
            if value
            else None
        )


    if (
        "resolution"
        in update_data
    ):
        value = (
            update_data[
                "resolution"
            ]
        )

        update_data[
            "resolution"
        ] = (
            value.strip()
            if value
            else None
        )


    for (
        field,
        value,
    ) in update_data.items():

        setattr(
            item,
            field,
            value,
        )


    # -------------------------------------------------
    # AUTOMATIC STATUS WHEN ASSIGNED
    # -------------------------------------------------

    if (
        item.assigned_to
        and
        item.status
        == "Open"
    ):
        item.status = (
            "Assigned"
        )


    # -------------------------------------------------
    # RESOLVED / CLOSED TIMESTAMP
    # -------------------------------------------------

    if (
        item.status
        in [
            "Resolved",
            "Closed",
        ]
    ):

        if (
            item.completed_at
            is None
        ):
            item.completed_at = (
                utc_now()
            )

    else:
        item.completed_at = (
            None
        )


    # -------------------------------------------------
    # STUDENT NOTIFICATION
    # -------------------------------------------------

    if (
        item.student_id
    ):

        message_parts = []


        if (
            old_status
            != item.status
        ):
            message_parts.append(
                (
                    "Status changed from "
                    f"{old_status} to "
                    f"{item.status}."
                )
            )


        if (
            old_assignee
            != item.assigned_to
            and
            item.assigned_to
        ):
            message_parts.append(
                (
                    "Assigned to "
                    f"{item.assigned_to}."
                )
            )


        if (
            item.scheduled_date
        ):
            message_parts.append(
                (
                    "Scheduled for "
                    f"{item.scheduled_date}."
                )
            )


        if (
            item.status
            in [
                "Resolved",
                "Closed",
            ]
        ):

            if item.resolution:
                message_parts.append(
                    (
                        "Resolution: "
                        f"{item.resolution}"
                    )
                )


        if message_parts:

            create_student_notification(
                db=db,

                student_id=
                    item.student_id,

                title=(
                    "Maintenance work "
                    "order updated"
                ),

                message=
                    " ".join(
                        message_parts
                    ),

                category=
                    "Maintenance",

                level=(
                    "Success"
                    if item.status
                    in [
                        "Resolved",
                        "Closed",
                    ]
                    else "Info"
                ),

                link=
                    "/maintenance",
            )


    db.commit()

    db.refresh(
        item
    )


    return work_order_response(
        db,
        item,
    )


# =====================================================
# STUDENT CANCEL OPEN REQUEST
# =====================================================

@router.delete(
    "/{work_order_id}/cancel",
    response_model=
        MaintenanceResponse,
)
def cancel_work_order(
    work_order_id: int,

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


    item = (
        db.query(
            MaintenanceWorkOrder
        )
        .filter(
            MaintenanceWorkOrder.id
            == work_order_id,

            MaintenanceWorkOrder.student_id
            == student.id,
        )
        .with_for_update()
        .first()
    )


    if not item:
        raise HTTPException(
            status_code=404,
            detail=(
                "Maintenance work order "
                "not found"
            ),
        )


    if (
        item.status
        not in [
            "Open",
            "Assigned",
        ]
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "This maintenance request "
                "can no longer be cancelled"
            ),
        )


    item.status = (
        "Cancelled"
    )


    create_role_notifications(
        db=db,

        roles=[
            "Admin",
            "Warden",
        ],

        title=
            "Maintenance request cancelled",

        message=(
            f"{student.name} cancelled "
            f"work order "
            f"WO-{item.id:05d}."
        ),

        category=
            "Maintenance",

        level=
            "Info",

        link=
            "/maintenance",
    )


    db.commit()

    db.refresh(
        item
    )


    return work_order_response(
        db,
        item,
    )