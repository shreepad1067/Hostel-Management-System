from datetime import datetime

from pydantic import BaseModel


class AuditLogResponse(
    BaseModel
):
    id: int

    actor_user_id: int | None

    actor_name: str | None

    actor_role: str | None

    action: str

    module: str

    entity_type: str | None

    entity_id: int | None

    description: str

    request_method: str

    request_path: str

    response_status: int

    outcome: str

    details: str | None

    created_at: datetime