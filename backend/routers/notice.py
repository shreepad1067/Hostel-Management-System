from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.notice import Notice
from models.user import User
from schemas.notice import (
    NoticeCreate,
    NoticeUpdate,
    NoticeResponse
)
from dependencies import get_current_user, require_roles


router = APIRouter(
    prefix="/notices",
    tags=["Notices"]
)


# CREATE NOTICE
@router.post("/", response_model=NoticeResponse)
def create_notice(
    notice: NoticeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Warden"))
):
    # Validate expiry date
    if notice.expiry_date and notice.notice_date:
        if notice.expiry_date < notice.notice_date:
            raise HTTPException(
                status_code=400,
                detail="Expiry date cannot be before notice date"
            )

    new_notice = Notice(
        title=notice.title,
        content=notice.content,
        category=notice.category,
        notice_date=notice.notice_date,
        expiry_date=notice.expiry_date,
        status=notice.status,
        remarks=notice.remarks
    )

    db.add(new_notice)
    db.commit()
    db.refresh(new_notice)

    return new_notice


# GET ALL NOTICES
@router.get("/", response_model=list[NoticeResponse])
def get_notices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notices = db.query(Notice).all()

    return notices


# GET NOTICE BY ID
@router.get("/{notice_id}", response_model=NoticeResponse)
def get_notice(
    notice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    notice = db.query(Notice).filter(
        Notice.id == notice_id
    ).first()

    if not notice:
        raise HTTPException(
            status_code=404,
            detail="Notice not found"
        )

    return notice


# UPDATE NOTICE
@router.put("/{notice_id}", response_model=NoticeResponse)
def update_notice(
    notice_id: int,
    notice_data: NoticeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Warden"))
):
    notice = db.query(Notice).filter(
        Notice.id == notice_id
    ).first()

    if not notice:
        raise HTTPException(
            status_code=404,
            detail="Notice not found"
        )

    # Validate expiry date
    if notice_data.expiry_date:
        if notice_data.expiry_date < notice_data.notice_date:
            raise HTTPException(
                status_code=400,
                detail="Expiry date cannot be before notice date"
            )

    notice.title = notice_data.title
    notice.content = notice_data.content
    notice.category = notice_data.category
    notice.notice_date = notice_data.notice_date
    notice.expiry_date = notice_data.expiry_date
    notice.status = notice_data.status
    notice.remarks = notice_data.remarks

    db.commit()
    db.refresh(notice)

    return notice


# DELETE NOTICE
@router.delete("/{notice_id}")
def delete_notice(
    notice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Warden"))
):
    notice = db.query(Notice).filter(
        Notice.id == notice_id
    ).first()

    if not notice:
        raise HTTPException(
            status_code=404,
            detail="Notice not found"
        )

    db.delete(notice)
    db.commit()

    return {
        "message": "Notice deleted successfully"
    }