from fastapi import FastAPI

from fastapi.middleware.cors import (
    CORSMiddleware,
)

from routers import (
    account_management,
    ai,
    allocation,
    attendance,
    auth,
    complaint,
    fee,
    food_feedback,
    food_menu,
    hostel_profile,
    leave,
    meal_confirmation,
    notice,
    room,
    sos_alert,
    student,
    visitor,
    website_feedback,
)


app = FastAPI(
    title=(
        "Hostel Management System API"
    )
)


app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


app.include_router(
    student.router
)

app.include_router(
    room.router
)

app.include_router(
    allocation.router
)

app.include_router(
    fee.router
)

app.include_router(
    attendance.router
)

app.include_router(
    complaint.router
)

app.include_router(
    leave.router
)

app.include_router(
    visitor.router
)

app.include_router(
    notice.router
)

app.include_router(
    auth.router
)

app.include_router(
    meal_confirmation.router
)

app.include_router(
    food_menu.router
)

app.include_router(
    food_feedback.router
)

app.include_router(
    website_feedback.router
)

app.include_router(
    hostel_profile.router
)

app.include_router(
    sos_alert.router
)

app.include_router(
    ai.router
)

app.include_router(
    account_management.router
)


@app.get("/")
def home():
    return {
        "message":
            "Hostel Management System API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "OK"
    }