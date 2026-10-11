import base64
import json
import re

from sqlalchemy.orm import Session

from models.audit_log import AuditLog
from models.user import User


MODULE_MAP = {
    "students":
        (
            "Students",
            "Student",
        ),

    "rooms":
        (
            "Rooms",
            "Room",
        ),

    "room-allocation":
        (
            "Room Allocation",
            "Room Allocation",
        ),

    "room-transfers":
        (
            "Room Transfer",
            "Room Transfer",
        ),

    "maintenance":
        (
            "Maintenance",
            "Maintenance Work Order",
        ),

    "fees":
        (
            "Fees",
            "Fee",
        ),

    "fee-receipts":
        (
            "Fees",
            "Fee Receipt",
        ),

    "visitors":
        (
            "Visitors",
            "Visitor",
        ),

    "attendance":
        (
            "Attendance",
            "Attendance",
        ),

    "complaints":
        (
            "Complaints",
            "Complaint",
        ),

    "leave":
        (
            "Leave",
            "Leave Request",
        ),

    "notices":
        (
            "Notices",
            "Notice",
        ),

    "food-menu":
        (
            "Food Menu",
            "Food Menu",
        ),

    "food-feedback":
        (
            "Food Feedback",
            "Food Feedback",
        ),

    "meal-confirmation":
        (
            "Meal Tracking",
            "Meal",
        ),

    "sos":
        (
            "SOS",
            "SOS Alert",
        ),

    "sos-alerts":
        (
            "SOS",
            "SOS Alert",
        ),

    "accounts":
        (
            "Account Management",
            "User Account",
        ),

    "account-management":
        (
            "Account Management",
            "User Account",
        ),

    "hostel-profile":
        (
            "Hostel Profile",
            "Hostel Profile",
        ),

    "website-feedback":
        (
            "Website Feedback",
            "Website Feedback",
        ),
}


SKIPPED_PREFIXES = (
    "/notifications",
    "/audit-logs",
)


def decode_token_payload(
    token: str,
) -> dict:

    try:
        parts = token.split(".")

        if (
            len(parts) < 2
        ):
            return {}


        payload = parts[1]

        padding = (
            "=" *
            (
                -len(payload)
                % 4
            )
        )


        decoded = (
            base64
            .urlsafe_b64decode(
                payload
                + padding
            )
            .decode(
                "utf-8"
            )
        )


        value = json.loads(
            decoded
        )


        return (
            value
            if isinstance(
                value,
                dict
            )
            else {}
        )

    except Exception:
        return {}


def extract_bearer_token(
    authorization: str | None,
) -> str | None:

    if not authorization:
        return None


    parts = authorization.split(
        " ",
        1,
    )


    if (
        len(parts) != 2
        or
        parts[0].lower()
        != "bearer"
    ):
        return None


    return (
        parts[1].strip()
        or None
    )


def find_user_from_payload(
    db: Session,
    payload: dict,
) -> User | None:

    possible_id = (
        payload.get(
            "user_id"
        )
        or
        payload.get(
            "id"
        )
    )


    if possible_id is not None:

        try:
            user = (
                db.query(User)
                .filter(
                    User.id
                    == int(
                        possible_id
                    )
                )
                .first()
            )


            if user:
                return user

        except (
            TypeError,
            ValueError,
        ):
            pass


    subject = payload.get(
        "sub"
    )


    if subject:

        try:
            numeric_subject = int(
                subject
            )


            user = (
                db.query(User)
                .filter(
                    User.id
                    == numeric_subject
                )
                .first()
            )


            if user:
                return user

        except (
            TypeError,
            ValueError,
        ):
            pass


        user = (
            db.query(User)
            .filter(
                User.username
                == str(
                    subject
                )
            )
            .first()
        )


        if user:
            return user


        user = (
            db.query(User)
            .filter(
                User.email
                == str(
                    subject
                )
            )
            .first()
        )


        if user:
            return user


    email = payload.get(
        "email"
    )


    if email:

        user = (
            db.query(User)
            .filter(
                User.email
                == str(
                    email
                )
            )
            .first()
        )


        if user:
            return user


    username = payload.get(
        "username"
    )


    if username:

        user = (
            db.query(User)
            .filter(
                User.username
                == str(
                    username
                )
            )
            .first()
        )


        if user:
            return user


    return None


def should_audit_request(
    method: str,
    path: str,
) -> bool:

    method = (
        method.upper()
    )


    if (
        method
        not in {
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
        }
    ):
        return False


    for prefix in (
        SKIPPED_PREFIXES
    ):
        if path.startswith(
            prefix
        ):
            return False


    return True


def path_parts(
    path: str,
) -> list[str]:

    return [
        part
        for part in (
            path
            .strip("/")
            .split("/")
        )
        if part
    ]


def detect_module(
    path: str,
) -> tuple[
    str,
    str,
]:

    parts = path_parts(
        path
    )


    if not parts:
        return (
            "System",
            "System",
        )


    prefix = parts[0]


    return MODULE_MAP.get(
        prefix,
        (
            prefix
            .replace(
                "-",
                " "
            )
            .title(),

            prefix
            .replace(
                "-",
                " "
            )
            .title(),
        )
    )


def detect_entity_id(
    path: str,
) -> int | None:

    parts = path_parts(
        path
    )


    for part in parts[
        1:
    ]:

        if re.fullmatch(
            r"\d+",
            part,
        ):
            return int(
                part
            )


    return None


def detect_action(
    method: str,
    path: str,
) -> str:

    method = method.upper()

    lowered = path.lower()


    # ==========================================
    # SPECIAL BUSINESS ACTIONS
    # ==========================================

    if (
        "scan-pass"
        in lowered
    ):
        return "QR_SCAN"


    if (
        lowered.endswith(
            "/review"
        )
    ):
        return "REVIEW"


    if (
        "cancel"
        in lowered
    ):
        return "CANCEL"


    if (
        "complete-demo"
        in lowered
    ):
        return "PAYMENT_COMPLETE"


    if (
        "fail-demo"
        in lowered
    ):
        return "PAYMENT_FAILED"


    if (
        "/payments/"
        in lowered
        and
        lowered.endswith(
            "/start"
        )
    ):
        return "PAYMENT_START"


    if (
        "verify"
        in lowered
    ):
        return "VERIFY"


    if (
        "approve"
        in lowered
    ):
        return "APPROVE"


    if (
        "reject"
        in lowered
    ):
        return "REJECT"


    # ==========================================
    # GENERIC CRUD
    # ==========================================

    if (
        method == "POST"
    ):
        return "CREATE"


    if (
        method in {
            "PUT",
            "PATCH",
        }
    ):
        return "UPDATE"


    if (
        method == "DELETE"
    ):
        return "DELETE"


    return method


def action_label(
    action: str,
) -> str:

    labels = {
        "CREATE":
            "Created",

        "UPDATE":
            "Updated",

        "DELETE":
            "Deleted",

        "REVIEW":
            "Reviewed",

        "VERIFY":
            "Verified",

        "APPROVE":
            "Approved",

        "REJECT":
            "Rejected",

        "CANCEL":
            "Cancelled",

        "QR_SCAN":
            "Scanned",

        "PAYMENT_START":
            "Started payment for",

        "PAYMENT_COMPLETE":
            "Completed payment for",

        "PAYMENT_FAILED":
            "Marked payment failed for",
    }


    return labels.get(
        action,
        action
        .replace(
            "_",
            " "
        )
        .title(),
    )


def build_description(
    *,
    action: str,
    entity_type: str,
    entity_id: int | None,
    outcome: str,
) -> str:

    label = action_label(
        action
    )


    target = (
        f"{entity_type} #{entity_id}"
        if entity_id is not None
        else entity_type
    )


    description = (
        f"{label} {target}"
    )


    if (
        outcome != "Success"
    ):
        description += (
            " — request failed"
        )


    return description


def create_audit_log(
    *,
    db: Session,
    payload: dict,
    method: str,
    path: str,
    response_status: int,
):

    user = (
        find_user_from_payload(
            db,
            payload,
        )
    )


    actor_user_id = (
        user.id
        if user
        else None
    )


    actor_name = (
        (
            user.full_name
            or
            user.username
            or
            user.email
        )
        if user
        else (
            payload.get(
                "full_name"
            )
            or
            payload.get(
                "username"
            )
            or
            payload.get(
                "email"
            )
            or
            payload.get(
                "sub"
            )
        )
    )


    actor_role = (
        user.role
        if user
        else payload.get(
            "role"
        )
    )


    # Do not create anonymous business audit records.
    if (
        actor_user_id is None
        and
        not actor_name
        and
        not actor_role
    ):
        return


    (
        module,
        entity_type,
    ) = detect_module(
        path
    )


    entity_id = (
        detect_entity_id(
            path
        )
    )


    action = detect_action(
        method,
        path,
    )


    outcome = (
        "Success"
        if response_status < 400
        else "Failed"
    )


    description = (
        build_description(
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            outcome=outcome,
        )
    )


    details = json.dumps(
        {
            "status_code":
                response_status,
        },
        separators=(
            ",",
            ":",
        ),
    )


    log = AuditLog(
        actor_user_id=
            actor_user_id,

        actor_name=(
            str(
                actor_name
            )[:150]
            if actor_name
            else None
        ),

        actor_role=(
            str(
                actor_role
            )[:50]
            if actor_role
            else None
        ),

        action=
            action,

        module=
            module,

        entity_type=
            entity_type,

        entity_id=
            entity_id,

        description=
            description,

        request_method=
            method.upper(),

        request_path=
            path[:500],

        response_status=
            response_status,

        outcome=
            outcome,

        details=
            details,
    )


    db.add(
        log
    )

    db.commit()