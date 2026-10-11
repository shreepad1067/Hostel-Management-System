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
    FoodMenuResponse,
    FoodMenuUpdate,
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
    value: str,
) -> str:
    result = (
        value.strip().title()
    )

    if result not in ALLOWED_DAYS:
        raise HTTPException(
            status_code=400,
            detail="Invalid day.",
        )

    return result


def normalize_meal(
    value: str,
) -> str:
    result = (
        value.strip().title()
    )

    if result not in ALLOWED_MEALS:
        raise HTTPException(
            status_code=400,
            detail="Invalid meal type.",
        )

    return result


def normalize_items(
    value: str,
) -> str:
    value = value.strip()

    if not value:
        raise HTTPException(
            status_code=400,
            detail=(
                "Menu items cannot be empty."
            ),
        )

    if len(value) > 500:
        raise HTTPException(
            status_code=400,
            detail=(
                "Menu items cannot exceed "
                "500 characters."
            ),
        )

    return value


def normalize_time(
    value: str | None,
) -> str | None:
    if not value:
        return None

    value = value.strip()

    if not value:
        return None

    if len(value) > 50:
        raise HTTPException(
            status_code=400,
            detail=(
                "Serving time is too long."
            ),
        )

    return value


def sorted_menu(
    records: list[FoodMenu],
):
    return sorted(
        records,
        key=lambda item: (
            DAY_ORDER.get(
                item.day_of_week,
                99,
            ),
            MEAL_ORDER.get(
                item.meal_type,
                99,
            ),
        ),
    )


@router.post(
    "/",
    response_model=FoodMenuResponse,
    status_code=201,
)
def create_menu(
    payload: FoodMenuCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Warden")
    ),
):
    day = normalize_day(
        payload.day_of_week
    )

    meal = normalize_meal(
        payload.meal_type
    )

    duplicate = (
        db.query(FoodMenu)
        .filter(
            FoodMenu.day_of_week == day,
            FoodMenu.meal_type == meal,
        )
        .first()
    )

    if duplicate:
        raise HTTPException(
            status_code=409,
            detail=(
                f"{meal} menu for {day} "
                "already exists."
            ),
        )

    menu = FoodMenu(
        day_of_week=day,
        meal_type=meal,
        menu_items=normalize_items(
            payload.menu_items
        ),
        serving_time=normalize_time(
            payload.serving_time
        ),
        is_active=payload.is_active,
    )

    db.add(menu)

    try:
        db.commit()

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail=(
                "Food menu already exists."
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
def weekly_menu(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "Admin",
            "Warden",
            "Student",
        )
    ),
):
    query = db.query(FoodMenu)

    if current_user.role == "Student":
        query = query.filter(
            FoodMenu.is_active
            .is_(True)
        )

    return sorted_menu(
        query.all()
    )


@router.get(
    "/today",
    response_model=list[
        FoodMenuResponse
    ],
)
def today_menu(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            "Admin",
            "Warden",
            "Student",
        )
    ),
):
    day = datetime.now(
        INDIA_TIMEZONE
    ).strftime("%A")

    query = (
        db.query(FoodMenu)
        .filter(
            FoodMenu.day_of_week == day
        )
    )

    if current_user.role == "Student":
        query = query.filter(
            FoodMenu.is_active
            .is_(True)
        )

    return sorted(
        query.all(),
        key=lambda item:
            MEAL_ORDER.get(
                item.meal_type,
                99,
            ),
    )


@router.put(
    "/{menu_id}",
    response_model=FoodMenuResponse,
)
def update_menu(
    menu_id: int,
    payload: FoodMenuUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Warden")
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
            status_code=404,
            detail="Menu not found.",
        )

    day = normalize_day(
        payload.day_of_week
    )

    meal = normalize_meal(
        payload.meal_type
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
            status_code=409,
            detail=(
                "A menu already exists "
                "for that day and meal."
            ),
        )

    menu.day_of_week = day
    menu.meal_type = meal

    menu.menu_items = (
        normalize_items(
            payload.menu_items
        )
    )

    menu.serving_time = (
        normalize_time(
            payload.serving_time
        )
    )

    menu.is_active = (
        payload.is_active
    )

    db.commit()
    db.refresh(menu)

    return menu


@router.delete(
    "/{menu_id}"
)
def delete_menu(
    menu_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("Warden")
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
            status_code=404,
            detail="Menu not found.",
        )

    db.delete(menu)
    db.commit()

    return {
        "message":
            "Food menu deleted successfully"
    }