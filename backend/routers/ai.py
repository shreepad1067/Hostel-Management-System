import json

from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy.orm import Session

from database import get_db
from dependencies import require_roles

from models.user import User
from models.student import Student
from models.complaint import Complaint
from models.notice import Notice
from models.room import Room

from models.meal_confirmation import (
    MealConfirmation,
)

from models.food_menu import (
    FoodMenu,
)

from models.sos_alert import (
    SOSAlert,
)

from schemas.ai import (
    AIQuestionRequest,
    AIAnswerResponse,
    ComplaintQueueItem,
    ComplaintAIResponse,
    NoticeAIRequest,
    NoticeAIResponse,
    ProvisioningStudent,
    ProvisioningSummaryResponse,
)

from services.ai_service import (
    AIServiceError,
    generate_json,
    generate_text,
)


router = APIRouter(
    prefix="/ai",
    tags=["AI"],
)


INDIA_TIMEZONE = ZoneInfo(
    "Asia/Kolkata"
)


COMPLAINT_CATEGORIES = {
    "General",
    "Maintenance",
    "Food",
    "Cleanliness",
    "Electricity",
    "Water",
    "Room",
    "Other",
}


PRIORITIES = {
    "Low",
    "Medium",
    "High",
    "Urgent",
}


NOTICE_CATEGORIES = {
    "General",
    "Maintenance",
    "Fee",
    "Event",
    "Academic",
    "Holiday",
    "Emergency",
    "Other",
}


def today_india():
    return datetime.now(
        INDIA_TIMEZONE
    ).date()


def clean_required_text(
    value: str,
    field_name: str,
    max_length: int,
) -> str:
    cleaned = value.strip()

    if not cleaned:
        raise HTTPException(
            status_code=400,
            detail=(
                f"{field_name} "
                "cannot be empty."
            ),
        )

    if len(cleaned) > max_length:
        raise HTTPException(
            status_code=400,
            detail=(
                f"{field_name} cannot exceed "
                f"{max_length} characters."
            ),
        )

    return cleaned


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

    if student is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "No student record is linked "
                "to this user account."
            ),
        )

    return student


def build_student_snapshot(
    db: Session,
    current_user: User,
) -> dict:
    student = get_student_for_user(
        db,
        current_user,
    )

    today = today_india()

    complaints = (
        db.query(Complaint)
        .filter(
            Complaint.student_id
            == student.id
        )
        .order_by(
            Complaint
            .complaint_date
            .desc()
        )
        .limit(10)
        .all()
    )

    meals = (
        db.query(MealConfirmation)
        .filter(
            MealConfirmation.student_id
            == student.id,

            MealConfirmation.meal_date
            == today,
        )
        .all()
    )

    today_name = datetime.now(
        INDIA_TIMEZONE
    ).strftime("%A")

    menu = (
        db.query(FoodMenu)
        .filter(
            FoodMenu.day_of_week
            == today_name,

            FoodMenu.is_active.is_(
                True
            ),
        )
        .all()
    )

    notices = (
        db.query(Notice)
        .filter(
            Notice.status
            == "Active"
        )
        .order_by(
            Notice.notice_date.desc()
        )
        .limit(10)
        .all()
    )

    sos_alerts = (
        db.query(SOSAlert)
        .filter(
            SOSAlert.student_id
            == student.id
        )
        .order_by(
            SOSAlert
            .created_at
            .desc()
        )
        .limit(5)
        .all()
    )

    return {
        "role": "Student",

        "current_date": str(
            today
        ),

        "student": {
            "student_id":
                student.id,

            "student_code":
                student.student_code,

            "name":
                student.name,

            "course":
                student.course,

            "year":
                student.year,

            "room_number":
                student.room_number,

            "room_preference":
                student.room_preference,

            "admission_status":
                student.admission_status,
        },

        "today_meals_confirmed": [
            meal.meal_type
            for meal in meals
        ],

        "today_food_menu": [
            {
                "meal":
                    item.meal_type,

                "items":
                    item.menu_items,

                "serving_time":
                    item.serving_time,
            }
            for item in menu
        ],

        "recent_complaints": [
            {
                "id":
                    complaint.id,

                "title":
                    complaint.title,

                "category":
                    complaint.category,

                "status":
                    complaint.status,

                "date":
                    str(
                        complaint
                        .complaint_date
                    ),

                "resolution":
                    complaint.resolution,
            }
            for complaint in complaints
        ],

        "active_notices": [
            {
                "title":
                    notice.title,

                "category":
                    notice.category,

                "date":
                    str(
                        notice.notice_date
                    ),

                "content":
                    notice.content,
            }
            for notice in notices
        ],

        "recent_sos_alerts": [
            {
                "category":
                    alert.category,

                "status":
                    alert.status,

                "created_at":
                    str(
                        alert.created_at
                    ),
            }
            for alert in sos_alerts
        ],
    }


def build_management_snapshot(
    db: Session,
    current_user: User,
) -> dict:
    today = today_india()

    students_total = (
        db.query(Student)
        .count()
    )

    admitted_students = (
        db.query(Student)
        .filter(
            Student.admission_status
            == "Admitted"
        )
        .count()
    )

    linked_accounts = (
        db.query(Student)
        .filter(
            Student.user_id.isnot(
                None
            )
        )
        .count()
    )

    account_pending = (
        db.query(Student)
        .filter(
            Student.admission_status
            == "Admitted",

            Student.user_id.is_(
                None
            ),
        )
        .count()
    )

    room_count = (
        db.query(Room)
        .count()
    )

    available_rooms = (
        db.query(Room)
        .filter(
            Room.status
            == "Available"
        )
        .count()
    )

    maintenance_rooms = (
        db.query(Room)
        .filter(
            Room.status
            == "Maintenance"
        )
        .count()
    )

    complaints_total = (
        db.query(Complaint)
        .count()
    )

    complaints_pending = (
        db.query(Complaint)
        .filter(
            Complaint.status
            == "Pending"
        )
        .count()
    )

    complaints_progress = (
        db.query(Complaint)
        .filter(
            Complaint.status
            == "In Progress"
        )
        .count()
    )

    complaints_resolved = (
        db.query(Complaint)
        .filter(
            Complaint.status
            == "Resolved"
        )
        .count()
    )

    active_notices = (
        db.query(Notice)
        .filter(
            Notice.status
            == "Active"
        )
        .count()
    )

    today_meals = (
        db.query(
            MealConfirmation
        )
        .filter(
            MealConfirmation.meal_date
            == today
        )
        .count()
    )

    pending_sos = (
        db.query(SOSAlert)
        .filter(
            SOSAlert.status
            == "Pending"
        )
        .count()
    )

    genuine_sos = (
        db.query(SOSAlert)
        .filter(
            SOSAlert.status
            == "Genuine"
        )
        .count()
    )

    false_sos = (
        db.query(SOSAlert)
        .filter(
            SOSAlert.status
            == "False"
        )
        .count()
    )

    active_menu_items = (
        db.query(FoodMenu)
        .filter(
            FoodMenu.is_active.is_(
                True
            )
        )
        .count()
    )

    snapshot = {
        "role":
            current_user.role,

        "current_date":
            str(today),

        "students": {
            "total":
                students_total,

            "admitted":
                admitted_students,

            "linked_accounts":
                linked_accounts,

            "admitted_without_account":
                account_pending,
        },

        "rooms": {
            "total":
                room_count,

            "available":
                available_rooms,

            "maintenance":
                maintenance_rooms,
        },

        "complaints": {
            "total":
                complaints_total,

            "pending":
                complaints_pending,

            "in_progress":
                complaints_progress,

            "resolved":
                complaints_resolved,
        },

        "notices": {
            "active":
                active_notices,
        },

        "meal_tracking": {
            "confirmations_today":
                today_meals,
        },

        "food_menu": {
            "active_entries":
                active_menu_items,
        },

        "sos": {
            "pending":
                pending_sos,

            "genuine":
                genuine_sos,

            "false":
                false_sos,
        },
    }

    if current_user.role == "Admin":
        pending_students = (
            db.query(Student)
            .filter(
                Student.admission_status
                == "Admitted",

                Student.user_id.is_(
                    None
                ),
            )
            .order_by(
                Student.id.asc()
            )
            .limit(20)
            .all()
        )

        snapshot[
            "account_provisioning"
        ] = [
            {
                "student_code":
                    student.student_code,

                "name":
                    student.name,

                "course":
                    student.course,

                "year":
                    student.year,
            }
            for student
            in pending_students
        ]

    return snapshot


def build_snapshot(
    db: Session,
    current_user: User,
) -> dict:
    if (
        current_user.role
        == "Student"
    ):
        return (
            build_student_snapshot(
                db,
                current_user,
            )
        )

    return (
        build_management_snapshot(
            db,
            current_user,
        )
    )


@router.post(
    "/assistant",
    response_model=AIAnswerResponse,
)
def hostel_ai_assistant(
    payload: AIQuestionRequest,

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
    question = clean_required_text(
        payload.question,
        "Question",
        1000,
    )

    snapshot = build_snapshot(
        db,
        current_user,
    )

    instruction = """
You are HostelHub Assistant.

Answer questions using only the supplied
HostelHub database snapshot.

Use simple, clear English.

The user may ask about hostel records,
their own information, meals, complaints,
rooms, notices, SOS records, admissions,
or operational counts.

For Student users:
- Only discuss information contained in
  their own student snapshot.
- Never imply access to other students.

For Admin and Warden users:
- You may summarize the supplied
  hostel-wide operational statistics.

Do not invent records.

Do not generate passwords or credentials.

Do not reveal authentication information.

Do not make an SOS Genuine/False decision.

If the question cannot be answered from
the supplied data, say that the required
information is not available in the
current HostelHub data snapshot.
"""

    content = json.dumps(
        {
            "question": question,
            "hostel_data": snapshot,
        },
        ensure_ascii=False,
        default=str,
    )

    try:
        answer = generate_text(
            instruction,
            content,
        )

    except AIServiceError as exc:
        raise HTTPException(
            status_code=503,
            detail=str(exc),
        )

    return AIAnswerResponse(
        answer=answer
    )


@router.get(
    "/complaints/queue",
    response_model=list[
        ComplaintQueueItem
    ],
)
def complaint_ai_queue(
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
    complaints = (
        db.query(Complaint)
        .order_by(
            Complaint
            .complaint_date
            .desc(),

            Complaint
            .id
            .desc(),
        )
        .limit(100)
        .all()
    )

    return [
        ComplaintQueueItem(
            id=complaint.id,

            student_id=(
                complaint.student_id
            ),

            title=(
                complaint.title
            ),

            description=(
                complaint.description
            ),

            category=(
                complaint.category
            ),

            complaint_date=str(
                complaint.complaint_date
            ),

            status=(
                complaint.status
            ),
        )
        for complaint
        in complaints
    ]


@router.post(
    "/complaints/{complaint_id}/analyze",
    response_model=ComplaintAIResponse,
)
def analyze_complaint(
    complaint_id: int,

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
    complaint = (
        db.query(Complaint)
        .filter(
            Complaint.id
            == complaint_id
        )
        .first()
    )

    if complaint is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "Complaint not found."
            ),
        )

    instruction = """
Analyze the hostel complaint supplied
as data.

This is decision-support only.

Do not modify the complaint.

Choose exactly one suggested_category
from:

General
Maintenance
Food
Cleanliness
Electricity
Water
Room
Other

Choose exactly one priority from:

Low
Medium
High
Urgent

Urgent should only be used when the
complaint text clearly suggests an
immediate safety, serious health,
major electrical/fire/water hazard,
or similarly time-critical situation.

Write a short factual summary.

Write a practical recommended_action
for hostel staff.

Do not claim that an action has already
been taken.

Return this exact JSON structure:

{
  "suggested_category": "...",
  "priority": "...",
  "summary": "...",
  "recommended_action": "..."
}
"""

    complaint_data = json.dumps(
        {
            "complaint_id":
                complaint.id,

            "current_category":
                complaint.category,

            "title":
                complaint.title,

            "description":
                complaint.description,

            "status":
                complaint.status,

            "complaint_date":
                str(
                    complaint
                    .complaint_date
                ),

            "resolution":
                complaint.resolution,
        },
        ensure_ascii=False,
        default=str,
    )

    try:
        result = generate_json(
            instruction,
            complaint_data,
        )

    except AIServiceError as exc:
        raise HTTPException(
            status_code=503,
            detail=str(exc),
        )

    suggested_category = str(
        result.get(
            "suggested_category",
            "General",
        )
    ).strip().title()

    if (
        suggested_category
        not in COMPLAINT_CATEGORIES
    ):
        suggested_category = (
            "General"
        )

    priority = str(
        result.get(
            "priority",
            "Medium",
        )
    ).strip().title()

    if priority not in PRIORITIES:
        priority = "Medium"

    summary = str(
        result.get(
            "summary",
            "",
        )
    ).strip()

    recommended_action = str(
        result.get(
            "recommended_action",
            "",
        )
    ).strip()

    if not summary:
        summary = (
            "AI summary was not available."
        )

    if not recommended_action:
        recommended_action = (
            "Review the complaint manually."
        )

    return ComplaintAIResponse(
        complaint_id=(
            complaint.id
        ),

        suggested_category=(
            suggested_category
        ),

        priority=priority,

        summary=summary[:1000],

        recommended_action=(
            recommended_action[:1500]
        ),
    )


@router.post(
    "/notice-draft",
    response_model=NoticeAIResponse,
)
def generate_notice_draft(
    payload: NoticeAIRequest,

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
    topic = clean_required_text(
        payload.topic,
        "Topic",
        500,
    )

    audience = clean_required_text(
        payload.audience,
        "Audience",
        100,
    )

    tone = clean_required_text(
        payload.tone,
        "Tone",
        50,
    )

    category = (
        payload.category
        .strip()
        .title()
    )

    if category not in NOTICE_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid notice category."
            ),
        )

    key_points = (
        payload.key_points.strip()
        if payload.key_points
        else ""
    )

    if len(key_points) > 1500:
        raise HTTPException(
            status_code=400,
            detail=(
                "Key points cannot exceed "
                "1500 characters."
            ),
        )

    instruction = """
Create a professional hostel notice draft.

The draft must be suitable for the
HostelHub notice board.

Do not invent dates, fees, rules,
deadlines, names, room numbers, or
events that were not supplied.

If important details are missing,
write the notice without inventing them.

Return this exact JSON structure:

{
  "title": "...",
  "content": "...",
  "category": "...",
  "remarks": "..."
}

The content should be clear and concise.

The remarks field may be empty.

This endpoint creates a draft only.
It does not publish the notice.
"""

    content = json.dumps(
        {
            "topic": topic,
            "category": category,
            "audience": audience,
            "tone": tone,
            "key_points": key_points,
        },
        ensure_ascii=False,
    )

    try:
        result = generate_json(
            instruction,
            content,
        )

    except AIServiceError as exc:
        raise HTTPException(
            status_code=503,
            detail=str(exc),
        )

    title = str(
        result.get(
            "title",
            "",
        )
    ).strip()

    notice_content = str(
        result.get(
            "content",
            "",
        )
    ).strip()

    remarks = str(
        result.get(
            "remarks",
            "",
        )
    ).strip()

    if not title:
        title = topic[:150]

    if not notice_content:
        raise HTTPException(
            status_code=503,
            detail=(
                "AI did not generate "
                "notice content."
            ),
        )

    return NoticeAIResponse(
        title=title[:255],

        content=(
            notice_content[:5000]
        ),

        category=category,

        remarks=(
            remarks[:500]
            if remarks
            else None
        ),
    )


@router.post(
    "/analytics",
    response_model=AIAnswerResponse,
)
def natural_language_analytics(
    payload: AIQuestionRequest,

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
    question = clean_required_text(
        payload.question,
        "Analytics question",
        1000,
    )

    snapshot = (
        build_management_snapshot(
            db,
            current_user,
        )
    )

    instruction = """
You are the HostelHub analytics assistant.

Answer the management question using
ONLY the supplied database statistics.

Do not invent counts or percentages.

If a requested value is not present,
state that the current analytics snapshot
does not contain enough information.

Explain numbers in simple English.

You may calculate simple values from
the supplied numbers.

Do not generate SQL.

Do not request direct database access.

Do not expose passwords, credentials,
private authentication information,
or secrets.
"""

    data = json.dumps(
        {
            "question": question,
            "database_snapshot":
                snapshot,
        },
        ensure_ascii=False,
        default=str,
    )

    try:
        answer = generate_text(
            instruction,
            data,
        )

    except AIServiceError as exc:
        raise HTTPException(
            status_code=503,
            detail=str(exc),
        )

    return AIAnswerResponse(
        answer=answer
    )


@router.get(
    "/provisioning-summary",
    response_model=(
        ProvisioningSummaryResponse
    ),
)
def account_provisioning_summary(
    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        require_roles(
            "Admin"
        )
    ),
):
    admitted_students = (
        db.query(Student)
        .filter(
            Student.admission_status
            == "Admitted"
        )
        .count()
    )

    linked_accounts = (
        db.query(Student)
        .filter(
            Student.admission_status
            == "Admitted",

            Student.user_id.isnot(
                None
            ),
        )
        .count()
    )

    pending_students = (
        db.query(Student)
        .filter(
            Student.admission_status
            == "Admitted",

            Student.user_id.is_(
                None
            ),
        )
        .order_by(
            Student.id.asc()
        )
        .all()
    )

    return ProvisioningSummaryResponse(
        admitted_students=(
            admitted_students
        ),

        linked_accounts=(
            linked_accounts
        ),

        accounts_pending=(
            len(pending_students)
        ),

        students_without_accounts=[
            ProvisioningStudent(
                student_id=student.id,

                student_code=(
                    student.student_code
                ),

                name=student.name,

                course=student.course,

                year=student.year,
            )
            for student
            in pending_students
        ],
    )