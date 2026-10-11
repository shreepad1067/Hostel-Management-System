from sqlalchemy.orm import Session

from models.notification import Notification
from models.student import Student
from models.user import User


def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    category: str = "General",
    level: str = "Info",
    link: str | None = None,
) -> Notification:

    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        category=category,
        level=level,
        link=link,
        is_read=False,
    )

    db.add(notification)

    return notification


def create_student_notification(
    db: Session,
    student_id: int,
    title: str,
    message: str,
    category: str = "General",
    level: str = "Info",
    link: str | None = None,
) -> Notification | None:

    student = (
        db.query(Student)
        .filter(
            Student.id == student_id
        )
        .first()
    )

    if not student:
        return None

    if not student.user_id:
        return None

    return create_notification(
        db=db,
        user_id=student.user_id,
        title=title,
        message=message,
        category=category,
        level=level,
        link=link,
    )


def create_role_notifications(
    db: Session,
    roles: list[str],
    title: str,
    message: str,
    category: str = "General",
    level: str = "Info",
    link: str | None = None,
) -> list[Notification]:

    users = (
        db.query(User)
        .filter(
            User.role.in_(roles),
            User.is_active.is_(True),
        )
        .all()
    )

    notifications = []

    for user in users:
        notification = create_notification(
            db=db,
            user_id=user.id,
            title=title,
            message=message,
            category=category,
            level=level,
            link=link,
        )

        notifications.append(
            notification
        )

    return notifications
