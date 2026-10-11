from datetime import datetime

from fastapi import (
    APIRouter,
    Depends,
    Query,
)

from sqlalchemy import (
    or_,
)

from sqlalchemy.orm import Session

from database import get_db

from dependencies import (
    require_roles,
)

from models.audit_log import (
    AuditLog,
)

from models.user import User

from schemas.audit_log import (
    AuditLogResponse,
)


router = APIRouter(
    prefix="/audit-logs",
    tags=[
        "Audit Logs",
    ],
)


# ======================================================
# GET AUDIT LOGS — ADMIN ONLY
# ======================================================

@router.get(
    "/",
    response_model=
        list[
            AuditLogResponse
        ],
)
def get_audit_logs(
    search: str | None = Query(
        default=None,
    ),

    module: str | None = Query(
        default=None,
    ),

    action: str | None = Query(
        default=None,
    ),

    role: str | None = Query(
        default=None,
    ),

    outcome: str | None = Query(
        default=None,
    ),

    start_date: datetime | None = Query(
        default=None,
    ),

    end_date: datetime | None = Query(
        default=None,
    ),

    limit: int = Query(
        default=500,
        ge=1,
        le=1000,
    ),

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_roles(
            "Admin"
        )
    ),
):

    query = db.query(
        AuditLog
    )


    # ==========================================
    # SEARCH
    # ==========================================

    if (
        search
        and
        search.strip()
    ):

        term = (
            f"%{search.strip()}%"
        )


        query = query.filter(
            or_(
                AuditLog.actor_name
                .like(term),

                AuditLog.actor_role
                .like(term),

                AuditLog.action
                .like(term),

                AuditLog.module
                .like(term),

                AuditLog.entity_type
                .like(term),

                AuditLog.description
                .like(term),

                AuditLog.request_path
                .like(term),
            )
        )


    # ==========================================
    # FILTERS
    # ==========================================

    if (
        module
        and
        module != "All"
    ):
        query = query.filter(
            AuditLog.module
            == module
        )


    if (
        action
        and
        action != "All"
    ):
        query = query.filter(
            AuditLog.action
            == action
        )


    if (
        role
        and
        role != "All"
    ):
        query = query.filter(
            AuditLog.actor_role
            == role
        )


    if (
        outcome
        and
        outcome != "All"
    ):
        query = query.filter(
            AuditLog.outcome
            == outcome
        )


    if start_date:
        query = query.filter(
            AuditLog.created_at
            >= start_date
        )


    if end_date:
        query = query.filter(
            AuditLog.created_at
            <= end_date
        )


    logs = (
        query
        .order_by(
            AuditLog
            .created_at
            .desc(),
            AuditLog
            .id
            .desc(),
        )
        .limit(
            limit
        )
        .all()
    )


    return logs


# ======================================================
# AVAILABLE FILTER VALUES
# ======================================================

@router.get(
    "/filters"
)
def get_audit_filters(
    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_roles(
            "Admin"
        )
    ),
):

    modules = [
        value[0]
        for value in (
            db.query(
                AuditLog.module
            )
            .distinct()
            .order_by(
                AuditLog.module
            )
            .all()
        )
        if value[0]
    ]


    actions = [
        value[0]
        for value in (
            db.query(
                AuditLog.action
            )
            .distinct()
            .order_by(
                AuditLog.action
            )
            .all()
        )
        if value[0]
    ]


    roles = [
        value[0]
        for value in (
            db.query(
                AuditLog.actor_role
            )
            .distinct()
            .order_by(
                AuditLog.actor_role
            )
            .all()
        )
        if value[0]
    ]


    return {
        "modules":
            modules,

        "actions":
            actions,

        "roles":
            roles,

        "outcomes": [
            "Success",
            "Failed",
        ],
    }


# ======================================================
# SUMMARY
# ======================================================

@router.get(
    "/summary"
)
def get_audit_summary(
    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_roles(
            "Admin"
        )
    ),
):

    total = (
        db.query(
            AuditLog
        )
        .count()
    )


    successful = (
        db.query(
            AuditLog
        )
        .filter(
            AuditLog.outcome
            == "Success"
        )
        .count()
    )


    failed = (
        db.query(
            AuditLog
        )
        .filter(
            AuditLog.outcome
            == "Failed"
        )
        .count()
    )


    admin_actions = (
        db.query(
            AuditLog
        )
        .filter(
            AuditLog.actor_role
            == "Admin"
        )
        .count()
    )


    warden_actions = (
        db.query(
            AuditLog
        )
        .filter(
            AuditLog.actor_role
            == "Warden"
        )
        .count()
    )


    student_actions = (
        db.query(
            AuditLog
        )
        .filter(
            AuditLog.actor_role
            == "Student"
        )
        .count()
    )


    return {
        "total":
            total,

        "successful":
            successful,

        "failed":
            failed,

        "admin_actions":
            admin_actions,

        "warden_actions":
            warden_actions,

        "student_actions":
            student_actions,
    }