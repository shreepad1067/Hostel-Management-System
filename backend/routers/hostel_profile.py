from fastapi import (
    APIRouter,
    Depends,
)

from sqlalchemy.orm import Session

from database import get_db
from dependencies import require_roles

from models.hostel_profile import (
    HostelProfile,
)

from models.user import User

from schemas.hostel_profile import (
    HostelProfileResponse,
    HostelProfileUpdate,
)


router = APIRouter(
    prefix="/hostel-profile",
    tags=["About Hostel"],
)


def profile_record(
    db: Session,
) -> HostelProfile:
    profile = (
        db.query(HostelProfile)
        .filter(
            HostelProfile.id == 1
        )
        .first()
    )

    if profile:
        return profile

    profile = HostelProfile(
        id=1,
        hostel_name="HostelHub Residence",
        description=(
            "Welcome to HostelHub."
        ),
    )

    db.add(profile)
    db.commit()
    db.refresh(profile)

    return profile


@router.get(
    "/",
    response_model=HostelProfileResponse,
)
def get_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "Admin",
            "Warden",
            "Student",
        )
    ),
):
    return profile_record(db)


@router.put(
    "/",
    response_model=HostelProfileResponse,
)
def update_profile(
    payload: HostelProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin")
    ),
):
    profile = profile_record(db)

    for (
        field,
        value,
    ) in payload.model_dump().items():
        setattr(
            profile,
            field,
            value,
        )

    profile.updated_by = (
        current_user.id
    )

    db.commit()
    db.refresh(profile)

    return profile