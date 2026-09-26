from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
)


class FoodMenuCreate(BaseModel):
    day_of_week: str
    meal_type: str
    menu_items: str
    serving_time: str | None = None
    is_active: bool = True


class FoodMenuUpdate(BaseModel):
    day_of_week: str
    meal_type: str
    menu_items: str
    serving_time: str | None = None
    is_active: bool = True


class FoodMenuResponse(BaseModel):
    id: int
    day_of_week: str
    meal_type: str
    menu_items: str
    serving_time: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )