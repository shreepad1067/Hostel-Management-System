from datetime import (
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

from models.notification import (
    Notification,
)

from models.user import User

from schemas.notification import (
    NotificationCountResponse,
    NotificationResponse,
)


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
)


def utc_now_naive():
    return (
        datetime.now(timezone.utc)
        .replace(tzinfo=None)
    )


@router.get(
    "/",
    response_model=
        list[NotificationResponse],
)
def get_my_notifications(
    unread_only: bool = False,

    limit: int = Query(
        default=50,
        ge=1,
        le=100,
    ),

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
        db.query(Notification)
        .filter(
            Notification.user_id
            == current_user.id
        )
    )

    if unread_only:
        query = query.filter(
            Notification.is_read.is_(
                False
            )
        )

    return (
        query
        .order_by(
            Notification
            .created_at
            .desc()
        )
        .limit(limit)
        .all()
    )


@router.get(
    "/unread-count",
    response_model=
        NotificationCountResponse,
)
def unread_count(
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

    count = (
        db.query(Notification)
        .filter(
            Notification.user_id
            == current_user.id,

            Notification.is_read.is_(
                False
            ),
        )
        .count()
    )

    return {
        "unread_count": count
    }


@router.put(
    "/read-all"
)
def mark_all_read(
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

    unread = (
        db.query(Notification)
        .filter(
            Notification.user_id
            == current_user.id,

            Notification.is_read.is_(
                False
            ),
        )
        .all()
    )

    now = utc_now_naive()

    for notification in unread:
        notification.is_read = True
        notification.read_at = now

    db.commit()

    return {
        "message":
            "All notifications marked as read",
        "updated":
            len(unread),
    }


@router.put(
    "/{notification_id}/read",
    response_model=
        NotificationResponse,
)
def mark_notification_read(
    notification_id: int,

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

    notification = (
        db.query(Notification)
        .filter(
            Notification.id
            == notification_id,

            Notification.user_id
            == current_user.id,
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=404,
            detail=
                "Notification not found",
        )

    if not notification.is_read:
        notification.is_read = True

        notification.read_at = (
            utc_now_naive()
        )

        db.commit()
        db.refresh(notification)

    return notification


@router.delete(
    "/{notification_id}"
)
def delete_notification(
    notification_id: int,

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

    notification = (
        db.query(Notification)
        .filter(
            Notification.id
            == notification_id,

            Notification.user_id
            == current_user.id,
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=404,
            detail=
                "Notification not found",
        )

    db.delete(notification)
    db.commit()

    return {
        "message":
            "Notification deleted"
    }
