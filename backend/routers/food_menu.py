from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from dependencies import require_roles

from models.food_menu import FoodMenu
from models.user import User

from schemas.food_menu import (
    FoodMenuCreate,
    FoodMenuUpdate,
    FoodMenuResponse,
)


router = APIRouter(
    prefix="/food-menu",
    tags=["Food Menu"],
)


INDIA_TIMEZONE = ZoneInfo(
    "Asia/Kolkata"
)


ALLOWED_DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
]


ALLOWED_MEALS = [
    "Breakfast",
    "Lunch",
    "Snacks",
    "Dinner",
]


DAY_ORDER = {
    day: index
    for index, day in enumerate(
        ALLOWED_DAYS
    )
}


MEAL_ORDER = {
    meal: index
    for index, meal in enumerate(
        ALLOWED_MEALS
    )
}


def normalize_day(
    day: str,
) -> str:
    normalized = (
        day
        .strip()
        .title()
    )

    if normalized not in ALLOWED_DAYS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid day. Choose Monday "
                "through Sunday."
            ),
        )

    return normalized


def normalize_meal(
    meal: str,
) -> str:
    normalized = (
        meal
        .strip()
        .title()
    )

    if normalized not in ALLOWED_MEALS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid meal type. Choose "
                "Breakfast, Lunch, Snacks, or Dinner."
            ),
        )

    return normalized


def validate_menu_items(
    menu_items: str,
) -> str:
    value = menu_items.strip()

    if not value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Menu items cannot be empty.",
        )

    if len(value) > 500:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Menu items cannot exceed "
                "500 characters."
            ),
        )

    return value


def normalize_serving_time(
    serving_time: str | None,
) -> str | None:
    if serving_time is None:
        return None

    value = serving_time.strip()

    if not value:
        return None

    if len(value) > 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Serving time cannot exceed "
                "50 characters."
            ),
        )

    return value


def sort_menu(
    records: list[FoodMenu],
) -> list[FoodMenu]:
    return sorted(
        records,
        key=lambda record: (
            DAY_ORDER.get(
                record.day_of_week,
                99,
            ),
            MEAL_ORDER.get(
                record.meal_type,
                99,
            ),
        ),
    )


@router.post(
    "/",
    response_model=FoodMenuResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_food_menu(
    payload: FoodMenuCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin")
    ),
):
    day = normalize_day(
        payload.day_of_week
    )

    meal = normalize_meal(
        payload.meal_type
    )

    items = validate_menu_items(
        payload.menu_items
    )

    serving_time = normalize_serving_time(
        payload.serving_time
    )

    existing = (
        db.query(FoodMenu)
        .filter(
            FoodMenu.day_of_week == day,
            FoodMenu.meal_type == meal,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"{meal} menu for {day} "
                "already exists."
            ),
        )

    menu = FoodMenu(
        day_of_week=day,
        meal_type=meal,
        menu_items=items,
        serving_time=serving_time,
        is_active=payload.is_active,
    )

    db.add(menu)

    try:
        db.commit()

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"{meal} menu for {day} "
                "already exists."
            ),
        )

    db.refresh(menu)

    return menu


@router.get(
    "/weekly",
    response_model=list[
        FoodMenuResponse
    ],
)
def get_weekly_menu(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "Admin",
            "Student",
        )
    ),
):
    query = db.query(FoodMenu)

    if current_user.role == "Student":
        query = query.filter(
            FoodMenu.is_active.is_(True)
        )

    records = query.all()

    return sort_menu(records)


@router.get(
    "/today",
    response_model=list[
        FoodMenuResponse
    ],
)
def get_today_menu(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "Admin",
            "Student",
        )
    ),
):
    today_name = datetime.now(
        INDIA_TIMEZONE
    ).strftime("%A")

    query = (
        db.query(FoodMenu)
        .filter(
            FoodMenu.day_of_week
            == today_name
        )
    )

    if current_user.role == "Student":
        query = query.filter(
            FoodMenu.is_active.is_(True)
        )

    records = query.all()

    return sorted(
        records,
        key=lambda record:
            MEAL_ORDER.get(
                record.meal_type,
                99,
            ),
    )


@router.put(
    "/{menu_id}",
    response_model=FoodMenuResponse,
)
def update_food_menu(
    menu_id: int,
    payload: FoodMenuUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin")
    ),
):
    menu = (
        db.query(FoodMenu)
        .filter(
            FoodMenu.id == menu_id
        )
        .first()
    )

    if menu is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food menu record not found.",
        )

    day = normalize_day(
        payload.day_of_week
    )

    meal = normalize_meal(
        payload.meal_type
    )

    items = validate_menu_items(
        payload.menu_items
    )

    serving_time = normalize_serving_time(
        payload.serving_time
    )

    duplicate = (
        db.query(FoodMenu)
        .filter(
            FoodMenu.day_of_week == day,
            FoodMenu.meal_type == meal,
            FoodMenu.id != menu_id,
        )
        .first()
    )

    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"{meal} menu for {day} "
                "already exists."
            ),
        )

    menu.day_of_week = day
    menu.meal_type = meal
    menu.menu_items = items
    menu.serving_time = serving_time
    menu.is_active = payload.is_active

    try:
        db.commit()

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"{meal} menu for {day} "
                "already exists."
            ),
        )

    db.refresh(menu)

    return menu


@router.delete(
    "/{menu_id}",
)
def delete_food_menu(
    menu_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Admin")
    ),
):
    menu = (
        db.query(FoodMenu)
        .filter(
            FoodMenu.id == menu_id
        )
        .first()
    )

    if menu is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Food menu record not found.",
        )

    db.delete(menu)
    db.commit()

    return {
        "message":
            "Food menu deleted successfully"
    }